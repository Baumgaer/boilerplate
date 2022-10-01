import type { MetadataType } from "./MetadataTypes";
import type { IConfiguration } from "./Transformer";
import type { PluginConfig } from "ttypescript/lib/PluginCreator";
import type * as ts from "typescript";

type DecoratorNames = "Model" | "Attr";
type TsNode<T extends DecoratorNames> = T extends "Attr" ? ts.PropertyDeclaration : ts.ClassDeclaration;
type NextFunction = (node: ts.PropertyDeclaration) => IAttrMetadata;

type BaseParams<T extends DecoratorNames> = [program: ts.Program, sourceFile: ts.SourceFile, node: TsNode<T>];

export interface IOptions<T extends DecoratorNames> {
    name: string;
    type: T;
    detect(this: PluginConfig & IConfiguration, ...params: BaseParams<T>): boolean;
    emitMetadata?(this: PluginConfig & IConfiguration, ...params: BaseParams<T>): Record<string, any> | void;
    emitType?(this: PluginConfig & IConfiguration, ...params: [...base: BaseParams<T>, next: NextFunction]): T extends "Attr" ? MetadataType : void;
}
