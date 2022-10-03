import type ts from "typescript";

export type environment = "test" | "client" | "common" | "server";
export interface IConfiguration {
    environment: environment;
    tsConfigPath: string;
}

export type ValidDeclarations = ts.ClassDeclaration | ts.PropertyDeclaration;
