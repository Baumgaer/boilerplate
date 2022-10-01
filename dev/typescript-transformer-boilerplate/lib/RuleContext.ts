import { camelCase } from "lodash";
import { isAbstractKeyword, isReadonlyKeyword, isPublicKeyword, isPromiseTypeNode } from "../../utils/SyntaxKind";
import type { DecoratorNames, IOptions } from "../@types/RuleContext";
import type { IConfiguration } from "../@types/Transformer";
import type { PluginConfig } from "ttypescript/lib/PluginCreator";
import type ts from "typescript";

class RuleContext<T extends DecoratorNames> {

    public type: T;

    public name: string;

    public config!: PluginConfig & IConfiguration;

    private options: IOptions<T>;

    public constructor(options: IOptions<T>) {
        this.type = options.type;
        this.name = options.name;
        this.options = options;
    }

    public detect(...params: Parameters<IOptions<T>["detect"]>) {
        return this.options.detect.call(this.config, ...params);
    }

    public emitMetadata(...params: Parameters<Required<IOptions<T>>["emitMetadata"]>) {
        if (this.type === "Attr") return this.emitMetadataAttr(...params);
        return this.emitMetadataModel(...params);
    }

    public emitType(...params: Parameters<Required<IOptions<T>>["emitType"]>) {
        if (this.type === "Attr") return this.emitTypeAttr(...params);
        return this.emitTypeModel(...params);
    }

    private emitMetadataModel(...params: Parameters<Required<IOptions<T>>["emitMetadata"]>) {
        const node = params[2] as ts.ClassDeclaration;
        const metadata = this.options.emitMetadata?.call(this.config, ...params) ?? {};
        const name = node.name?.getText();
        const isAbstract = node.modifiers?.some((modifier) => isAbstractKeyword(modifier));
        const className = name;
        const collectionName = `${camelCase(name)}s`;
        return Object.assign({ isAbstract, className, collectionName }, metadata);
    }

    private emitMetadataAttr(...params: Parameters<Required<IOptions<T>>["emitMetadata"]>) {
        const program = params[0];
        const checker = program.getTypeChecker();
        const node = params[2] as ts.PropertyDeclaration;
        const metadata = this.options.emitMetadata?.call(this.config, ...params) ?? {};

        const name = node.name.getText();
        const isRequired = !node.questionToken && !node.initializer || node.exclamationToken && !node.initializer;
        const isReadOnly = node.modifiers?.some((modifier) => isReadonlyKeyword(modifier));
        const isInternal = node.modifiers?.every((modifier) => !isPublicKeyword(modifier));
        const isLazy = isPromiseTypeNode(checker, node.type);

        return Object.assign({ name, isInternal, isReadOnly, isRequired, isLazy }, metadata);
    }

    private emitTypeModel(...params: Parameters<Required<IOptions<T>>["emitType"]>) {
        return this.options.emitType?.call(this.config, ...params) ?? {};
    }

    private emitTypeAttr(...params: Parameters<Required<IOptions<T>>["emitType"]>) {
        return this.options.emitType?.call(this.config, ...params) ?? {};
    }
}

export function createRule<T extends DecoratorNames>(options: IOptions<T>) {
    return new RuleContext(options);
}
