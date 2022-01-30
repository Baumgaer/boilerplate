import * as ts from "typescript";
import path from "path";
import arp from "app-root-path";
import clientConfig from "./../src/client/tsconfig.json";

export function isNull(type: ts.Type) {
    return (type.flags & ts.TypeFlags.Null) === ts.TypeFlags.Null;
}

export function isUndefined(type: ts.Type) {
    return (type.flags & ts.TypeFlags.Undefined) === ts.TypeFlags.Undefined;
}

export function isString(type: ts.Type) {
    return (type.flags & ts.TypeFlags.String) === ts.TypeFlags.String;
}

export function isNumber(type: ts.Type) {
    return (type.flags & ts.TypeFlags.Number) === ts.TypeFlags.Number;
}

export function isBoolean(type: ts.Type) {
    return (type.flags & ts.TypeFlags.Boolean) === ts.TypeFlags.Boolean || (type.flags & ts.TypeFlags.BooleanLiteral) === ts.TypeFlags.BooleanLiteral;
}

export function isLiteral(type: ts.Type) {
    return isNumberLiteral(type) || isStringLiteral(type);
}

export function isNumberLiteral(type: ts.Type) {
    return (type.flags & ts.TypeFlags.NumberLiteral) === ts.TypeFlags.NumberLiteral;
}

export function isStringLiteral(type: ts.Type) {
    return (type.flags & ts.TypeFlags.StringLiteral) === ts.TypeFlags.StringLiteral;
}

export function isUnionOrIntersection(type: ts.Type) {
    return isUnion(type) || isIntersection(type);
}

export function isUnion(type: ts.Type) {
    return (type.flags & ts.TypeFlags.Union) === ts.TypeFlags.Union;
}

export function isIntersection(type: ts.Type) {
    return (type.flags & ts.TypeFlags.Intersection) === ts.TypeFlags.Intersection;
}

export function isObject(type: ts.Type) {
    return (type.flags & ts.TypeFlags.Object) === ts.TypeFlags.Object;
}

export function isDate(type: ts.Type, property: ts.PropertyDeclaration) {
    if (!isObject(type) && !isAny(type)) return false;

    if (property.type && ts.isTypeReferenceNode(property.type)) {
        if (property.type.typeName.getText() === "Date") return true;
    }

    if (property.initializer) {
        if (ts.isNewExpression(property.initializer) || ts.isCallExpression(property.initializer)) {
            const identifier = <ts.Identifier>property.initializer.expression;
            if (identifier.getText() === "Date") return true;
        }
    }

    return false;
}

export function isAny(type: ts.Type) {
    return (type.flags & ts.TypeFlags.Any) === ts.TypeFlags.Any;
}

export function isDefaultExported(declaration: ts.ClassDeclaration) {
    return declaration.modifiers?.[0].kind === ts.SyntaxKind.ExportKeyword && declaration.modifiers?.[1].kind === ts.SyntaxKind.DefaultKeyword;
}

export function isValidSourceFile(sourceFile: ts.SourceFile): boolean {
    const validSourceFiles = [
        "/src/client/models",
        "/src/common/models",
        "/src/server/models",
        "/src/client/lib/BaseModel.ts",
        "/src/common/lib/BaseModel.ts",
        "/src/server/lib/BaseModel.ts"
    ];
    return validSourceFiles.some((path) => sourceFile.fileName.includes(path));
}

export function isValidAttrIdentifier(identifier: ts.Identifier, typeChecker: ts.TypeChecker) {
    const symbol = typeChecker.getSymbolAtLocation(identifier);
    if (!symbol) return false;

    const declaration = symbol.declarations?.[0];
    const importDeclaration = declaration?.parent?.parent?.parent;
    if (!importDeclaration || !ts.isImportDeclaration(importDeclaration)) return false;
    if (!ts.isStringLiteral(importDeclaration.moduleSpecifier)) return false;

    const importPath = importDeclaration.moduleSpecifier.text;
    const validAttrImports = ["~client/utils/decorators", "~common/utils/decorators", "~server/utils/decorators"];
    const isValidImport = validAttrImports.some((attrImport) => importPath === attrImport);
    return isValidImport;
}

export function resolveImportPath(importPath: string) {
    if (importPath.startsWith('"') && importPath.endsWith('"')) importPath = importPath.substring(1, importPath.length - 1);
    const pathParts = importPath.split("/");
    const entryPoint = pathParts.shift();
    const fileName = pathParts.pop() + ".ts";
    const relativePath = clientConfig.compilerOptions.paths[`${entryPoint}/*`][0].replace("*", "");
    return path.resolve(path.join(arp.path, "src", "client", relativePath, ...pathParts, fileName));
}

export function programFromConfig(configFileName: string) {
    const configFile = ts.sys.readFile(configFileName);
    if (!configFile) throw new Error("No configuration found");

    // basically a copy of https://github.com/Microsoft/TypeScript/blob/3663d400270ccae8b69cbeeded8ffdc8fa12d7ad/src/compiler/tsc.ts -> parseConfigFile
    const result = ts.parseConfigFileTextToJson(configFileName, configFile);
    const configObject = result.config;

    // Normalize configuration for parsing schema only
    const configParseResult = ts.parseJsonConfigFileContent(configObject, ts.sys, path.dirname(configFileName), {}, path.basename(configFileName));
    const options = configParseResult.options;
    options.noEmit = true;
    delete options.out;
    delete options.outDir;
    delete options.outFile;
    delete options.declaration;
    delete options.declarationDir;
    delete options.declarationMap;

    const program = ts.createProgram({
        rootNames: configParseResult.fileNames,
        options,
        projectReferences: configParseResult.projectReferences
    });
    return program;
}
