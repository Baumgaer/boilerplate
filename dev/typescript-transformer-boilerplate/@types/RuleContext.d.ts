import type { createRule, typeEmittingDecorators, nonTypeEmittingDecorators } from "../lib/RuleContext";
import type { MetadataType } from "./MetadataTypes";
import type { IConfiguration } from "./Transformer";
import type { PluginConfig } from "ttypescript/lib/PluginCreator";
import type * as ts from "typescript";

type TypeEmittingDecoratorNames = (keyof typeof typeEmittingDecorators)[];
type NonTypeEmittingDecoratorNames = (keyof typeof nonTypeEmittingDecorators)[];
type DecoratorNames = NonTypeEmittingDecoratorNames | TypeEmittingDecoratorNames;
type NextFunction = (node: ts.Node) => IAttrMetadata;

type BaseParams<T extends ts.Node> = [program: ts.Program, sourceFile: ts.SourceFile, node: T];

export interface IOptions<T extends DecoratorNames, D extends ts.Node> {
    name: string;
    type: T;
    detect(this: PluginConfig & IConfiguration, ...params: [...base: BaseParams<ts.Node>, matchedRules: ReturnType<typeof createRule<T>>[]]): D | false;
    emitMetadata?(this: PluginConfig & IConfiguration, ...params: BaseParams<D>): Record<string, any> | void;
    emitType?(this: PluginConfig & IConfiguration, ...params: [...base: BaseParams<D>, next: NextFunction]): T extends TypeEmittingDecoratorNames ? MetadataType : void;
}
