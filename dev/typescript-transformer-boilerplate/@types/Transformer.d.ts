import type ts from "typescript";

export interface IConfiguration {
    environment: "test" | "client" | "common" | "server";
    tsConfigPath: string;
}

export type ValidDeclarations = ts.ClassDeclaration | ts.PropertyDeclaration;
