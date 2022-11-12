import { camelCase, merge } from "lodash";
import { canHaveModifiers, getModifiers } from "typescript";
import {
    isAbstractKeyword,
    isReadonlyKeyword,
    isPublicKeyword,
    isPromiseTypeNode,
    isPropertyDeclaration,
    isPropertySignature,
    isParameter
} from "../../utils/SyntaxKind";
import type { DecoratorNames, IOptions, TypeEmittingDecoratorNames } from "../@types/RuleContext";
import type { IConfiguration } from "../@types/Transformer";
import type { PluginConfig } from "ttypescript/lib/PluginCreator";
import type ts from "typescript";

const typeEmittingDecoratorNames = ["Attr", "Arg"] as TypeEmittingDecoratorNames;

class RuleContext<T extends DecoratorNames, D extends ts.Node> {

    public type: T;

    public name: string;

    public config!: PluginConfig & IConfiguration;

    private options: IOptions<T, D>;

    public constructor(options: IOptions<T, D>) {
        this.type = options.type;
        this.name = options.name;
        this.options = options;
    }

    public detect(...params: Parameters<IOptions<T, D>["detect"]>) {
        return this.options.detect.call(this.config, ...params);
    }

    public emitMetadata(declarationNode: ts.Node, ...params: Parameters<Required<IOptions<T, D>>["emitMetadata"]>) {
        if (this.isTypeEmittingDecorator(this.type)) return this.emitMetadataTypeEmitting(declarationNode, ...params);
        return this.emitMetadataModel(declarationNode, ...params);
    }

    public emitType(...params: Parameters<Required<IOptions<T, D>>["emitType"]>) {
        if (this.isTypeEmittingDecorator(this.type)) return this.emitTypeTypeEmitting(...params);
        return this.emitTypeModel(...params);
    }

    private isTypeEmittingDecorator(type: string[]): type is TypeEmittingDecoratorNames {
        return type.every((theType) => typeEmittingDecoratorNames.includes(theType as any));
    }

    private emitMetadataModel(declarationNode: ts.Node, ...params: Parameters<Required<IOptions<T, D>>["emitMetadata"]>) {
        const node = declarationNode as ts.ClassDeclaration;
        const metadata = this.options.emitMetadata?.call(this.config, ...params) ?? {};
        const name = node.name?.getText();
        const isAbstract = node.modifiers?.some((modifier) => isAbstractKeyword(modifier));
        const className = name;
        const collectionName = `${camelCase(name)}s`;
        return merge({ isAbstract, className, collectionName }, metadata);
    }

    private emitMetadataTypeEmitting(declarationNode: ts.Node, ...params: Parameters<Required<IOptions<T, D>>["emitMetadata"]>) {
        const program = params[0];
        const checker = program.getTypeChecker();
        const node = declarationNode as ts.PropertyDeclaration | ts.PropertySignature;
        const metadata = this.options.emitMetadata?.call(this.config, ...params) ?? {};

        let defaultMetadata = {};
        if (isPropertyDeclaration(node) || isPropertySignature(node) || isParameter(node)) {
            const name = node.name.getText();
            const isRequired = !node.questionToken && !node.initializer || isPropertyDeclaration(node) && node.exclamationToken && !node.initializer;
            const isReadOnly = canHaveModifiers(node) && getModifiers(node)?.some((modifier) => isReadonlyKeyword(modifier));
            const isInternal = canHaveModifiers(node) && getModifiers(node)?.every((modifier) => !isPublicKeyword(modifier));
            const isLazy = isPromiseTypeNode(checker, node.type);
            defaultMetadata = { name, isInternal, isReadOnly, isRequired, isLazy };
        }

        return merge(defaultMetadata, metadata);
    }

    private emitTypeModel(...params: Parameters<Required<IOptions<T, D>>["emitType"]>) {
        return this.options.emitType?.call(this.config, ...params) ?? {};
    }

    private emitTypeTypeEmitting(...params: Parameters<Required<IOptions<T, D>>["emitType"]>) {
        return this.options.emitType?.call(this.config, ...params) ?? {};
    }
}

export function createRule<T extends DecoratorNames, D extends ts.Node>(options: IOptions<T, D>): RuleContext<T, D> {
    return new RuleContext(options);
}
