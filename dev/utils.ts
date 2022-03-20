import path from "path";
import arp from "app-root-path";
import * as ts from "typescript";
import clientConfig from "../src/client/tsconfig.json";

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

export function isArray(property: ts.PropertyDeclaration | ts.PropertySignature) {
    const kind = property.type?.kind || property.initializer?.kind;
    const isArrayType = kind && (kind & ts.SyntaxKind.ArrayType) === ts.SyntaxKind.ArrayType;
    const isArrayLiteralExpression = kind && (kind & ts.SyntaxKind.ArrayLiteralExpression) === ts.SyntaxKind.ArrayLiteralExpression;
    return Boolean(isArrayType || isArrayLiteralExpression);
}

export function isTupleType(node?: ts.TypeNode | ts.PropertyDeclaration | ts.PropertySignature): node is ts.TupleTypeNode {
    return Boolean(node && ts.isTupleTypeNode(node));
}

export function isOptional(node?: ts.TypeNode | ts.PropertyDeclaration | ts.PropertySignature) {
    return node && ts.isOptionalTypeNode(node);
}

export function isObject(type: ts.Type): type is ts.ObjectType {
    return (type.flags & ts.TypeFlags.Object) === ts.TypeFlags.Object;
}

export function isParenthesizedType(node?: ts.TypeNode | ts.PropertyDeclaration | ts.PropertySignature): node is ts.ParenthesizedTypeNode {
    if (!node) return false;
    let kind: ts.SyntaxKind | undefined = undefined;
    if (ts.isTypeNode(node)) {
        kind = node.kind;
    } else kind = node.type?.kind || node.initializer?.kind;
    return Boolean(kind && (kind & ts.SyntaxKind.ParenthesizedType) === ts.SyntaxKind.ParenthesizedType);
}

export function isPromise(node?: ts.TypeNode | ts.PropertyDeclaration | ts.PropertySignature): node is ts.TypeReferenceNode {
    return Boolean(node && ts.isTypeReferenceNode(node) && node.typeName.getText() === "Promise");
}

export function hasTypeLiteral(property: ts.PropertyDeclaration | ts.PropertySignature) {
    const kind = property.type?.kind;
    return Boolean(kind && (kind & ts.SyntaxKind.TypeLiteral) === ts.SyntaxKind.TypeLiteral);
}

export function isInterface(type: ts.Type, property: ts.PropertyDeclaration | ts.PropertySignature): boolean {
    return Boolean(property.type && type.isClassOrInterface() && !type.isClass() && ts.isTypeReferenceNode(property.type) && !isDate(type, property) ||
        hasTypeLiteral(property) ||
        property.questionToken && isUnion(type) && isInterface((<ts.UnionType>type).types[1], property));
}

export function isTypeParameter(type: ts.Type): type is ts.TypeParameter {
    return (type.flags & ts.TypeFlags.TypeParameter) === ts.TypeFlags.TypeParameter;
}

export function isModel(type: ts.Type, sourceFile: ts.SourceFile) {

    function isMaybeModelType(): boolean {
        for (const statement of sourceFile.statements) {
            if (!ts.isImportDeclaration(statement)) continue;
            const importClause = statement.importClause;
            const moduleSpecifier = statement.moduleSpecifier;

            if (!importClause?.name || !type.aliasSymbol) continue;
            if (importClause.name.getText() !== type.aliasSymbol.name) continue;

            let importPath = moduleSpecifier.getText();
            importPath = importPath.substring(1, importPath.length - 1);
            if (importPath.startsWith("~")) {
                const subProgram = programFromConfig(path.resolve(path.join(arp.path, "src", "client", "tsconfig.json")));

                const resolvedPath = resolveImportPath(importPath);
                const possibleSourceFiles = subProgram.getSourceFiles().filter(isValidSourceFile);
                const newSourceFile = possibleSourceFiles.find((sourceFile) => !path.relative(resolvedPath, sourceFile.fileName));
                if (!newSourceFile) continue;

                for (const statement of newSourceFile.statements) {
                    if (!ts.isClassDeclaration(statement)) continue;
                    if (!isDefaultExported(statement)) continue;
                    return true;
                }
            }
        }
        return false;
    }

    if (isMaybeModelType()) return true;
    if (!isTypeParameter(type) && !isObject(type)) return false;
    const symbol = type.symbol;
    if (symbol?.flags === ts.SymbolFlags.Class && symbol?.valueDeclaration && isValidSourceFile(<ts.SourceFile>symbol.valueDeclaration.parent)) {
        return true;
    }
    return false;
}

export function isDate(type: ts.Type, property: ts.PropertyDeclaration | ts.PropertySignature) {
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
    const entryPoint = pathParts.shift() as "~client" | "~common" | "~env" | "~test";
    const fileName = `${pathParts.pop()}.ts`;

    const paths = clientConfig.compilerOptions.paths;
    const relativePath = paths[`${entryPoint}/*`][0].replace("*", "");
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
