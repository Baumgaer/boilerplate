import { camelCase, merge, capitalize } from "lodash";
import { canHaveModifiers, getModifiers } from "typescript";
import {
    isAbstractKeyword,
    isReadonlyKeyword,
    isPublicKeyword,
    isPromiseTypeNode,
    isPropertyDeclaration,
    isPropertySignature,
    isParameter,
    isClassDeclaration,
    isMethodDeclaration
} from "../utils/SyntaxKind";
import type { DecoratorNames, IOptions } from "../@types/RuleContext";
import type { IConfiguration } from "../@types/Transformer";
import type { PluginConfig } from "ttypescript/lib/PluginCreator";
import type { PascalCase } from "type-fest";
import type ts from "typescript";

export const typeEmittingDecorators = {
    Attr: [
        { attachedNodeCheck: isPropertyDeclaration, resetsMetadata: true, echoType: "attr" },
        { attachedNodeCheck: isPropertySignature, resetsMetadata: true, echoType: "field" }
    ],
    Arg: [{ attachedNodeCheck: isParameter, resetsMetadata: true, echoType: "arg" }],
    Query: [{ attachedNodeCheck: isMethodDeclaration, resetsMetadata: false, echoType: "action" }],
    Mutation: [{ attachedNodeCheck: isMethodDeclaration, resetsMetadata: false, echoType: "action" }]
} as const;

export const nonTypeEmittingDecorators = {
    Model: [{ attachedNodeCheck: isClassDeclaration, resetsMetadata: false, echoType: "model" }]
} as const;

export const emittingDecorators = {
    ...typeEmittingDecorators,
    ...nonTypeEmittingDecorators
};

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
        const echoType = this.getEchoType(declarationNode);
        const methodName = `emitMetadata${capitalize(echoType) as PascalCase<typeof echoType>}` as const;
        if (methodName in this) return (Reflect.get(this, methodName) as any).call(this, declarationNode, ...params);
        return this.emitMetadataDefault(declarationNode, ...params);
    }

    public emitType(declarationNode: ts.Node, ...params: Parameters<Required<IOptions<T, D>>["emitType"]>) {
        const echoType = this.getEchoType(declarationNode);
        const methodName = `emitType${capitalize(echoType) as PascalCase<typeof echoType>}` as const;
        if (methodName in this) return (Reflect.get(this, methodName) as any).call(this, ...params);
        return this.emitTypeDefault(...params);
    }

    private getEchoType(node: ts.Node) {
        for (const decoratorName in emittingDecorators) {
            if (Object.prototype.hasOwnProperty.call(emittingDecorators, decoratorName)) {
                const checkers = emittingDecorators[decoratorName as keyof typeof emittingDecorators];
                for (const checker of checkers) {
                    if (checker.attachedNodeCheck(node)) return checker.echoType;
                }
            }
        }
        return "default";
    }

    //////////////////////
    // METADATA EMITTING

    private emitMetadataDefault(declarationNode: ts.Node, ...params: Parameters<Required<IOptions<T, D>>["emitMetadata"]>) {
        return this.options.emitMetadata?.call(this.config, ...params) ?? {};
    }

    // @ts-expect-error used dynamically
    private emitMetadataModel(declarationNode: ts.Node, ...params: Parameters<Required<IOptions<T, D>>["emitMetadata"]>) {
        const node = declarationNode as ts.ClassDeclaration;
        const metadata = this.options.emitMetadata?.call(this.config, ...params) ?? {};
        const name = node.name?.getText();
        const isAbstract = node.modifiers?.some((modifier) => isAbstractKeyword(modifier));
        const className = name;
        const collectionName = `${camelCase(name)}s`;
        return merge({ isAbstract, className, collectionName }, metadata);
    }

    // @ts-expect-error used dynamically
    private emitMetadataAttr(declarationNode: ts.Node, ...params: Parameters<Required<IOptions<T, D>>["emitMetadata"]>) {
        return this.emitMetadataAttributeLike(declarationNode, ...params);
    }

    // @ts-expect-error used dynamically
    private emitMetadataArg(declarationNode: ts.Node, ...params: Parameters<Required<IOptions<T, D>>["emitMetadata"]>) {
        return this.emitMetadataAttributeLike(declarationNode, ...params);
    }

    // @ts-expect-error used dynamically
    private emitMetadataField(declarationNode: ts.Node, ...params: Parameters<Required<IOptions<T, D>>["emitMetadata"]>) {
        return this.emitMetadataAttributeLike(declarationNode, ...params);
    }

    private emitMetadataAttributeLike(declarationNode: ts.Node, ...params: Parameters<Required<IOptions<T, D>>["emitMetadata"]>) {
        const program = params[0];
        const checker = program.getTypeChecker();
        const node = declarationNode as ts.PropertyDeclaration | ts.PropertySignature | ts.ParameterDeclaration;
        const metadata = this.options.emitMetadata?.call(this.config, ...params) ?? {};

        const name = node.name.getText();
        const isRequired = !node.questionToken && !node.initializer || isPropertyDeclaration(node) && node.exclamationToken && !node.initializer;
        const isReadOnly = canHaveModifiers(node) && getModifiers(node)?.some((modifier) => isReadonlyKeyword(modifier));
        const isInternal = canHaveModifiers(node) && getModifiers(node)?.every((modifier) => !isPublicKeyword(modifier));
        const isLazy = isPromiseTypeNode(checker, node.type);
        const defaultMetadata = { name, isInternal, isReadOnly, isRequired, isLazy };

        return merge(defaultMetadata, metadata);
    }

    //////////////////////
    // TYPE EMITTING

    private emitTypeDefault(...params: Parameters<Required<IOptions<T, D>>["emitType"]>) {
        return this.options.emitType?.call(this.config, ...params) ?? {};
    }

}

export function createRule<T extends DecoratorNames, D extends ts.Node>(options: IOptions<T, D>): RuleContext<T, D> {
    return new RuleContext(options);
}
