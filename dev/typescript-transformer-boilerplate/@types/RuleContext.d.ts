import type { createRule } from "../lib/RuleContext";
import type { MetadataType } from "./MetadataTypes";
import type { IConfiguration } from "./Transformer";
import type { PluginConfig } from "ttypescript/lib/PluginCreator";
import type * as ts from "typescript";

type DecoratorNames = "Model" | "Attr";
type NextFunction = (node: ts.Node) => IAttrMetadata;

type BaseParams = [program: ts.Program, sourceFile: ts.SourceFile, node: ts.Node];

export interface IOptions<T extends DecoratorNames> {
    name: string;
    type: T;
    detect(this: PluginConfig & IConfiguration, ...params: [...base: BaseParams, matchedRules: ReturnType<typeof createRule<T>>[]]): boolean;
    emitMetadata?(this: PluginConfig & IConfiguration, ...params: BaseParams): Record<string, any> | void;
    emitType?(this: PluginConfig & IConfiguration, ...params: [...base: BaseParams, next: NextFunction]): T extends "Attr" ? MetadataType : void;
}
