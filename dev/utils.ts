import fs from "fs";
import path from "path";
import arp from "app-root-path";
import { capitalize } from "lodash";
import * as ts from "typescript";
import clientConfig from "../src/client/tsconfig.json";
import serverConfig from "../src/server/tsconfig.json";
import testClientConfig from "../tests/unit/client/tsconfig.json";
import testServerConfig from "../tests/unit/server/tsconfig.json";
import defaultConfig from "../tsconfig.json";
import { customTypes } from "./CustomTypes";

const configs = { clientConfig, serverConfig, testClientConfig, testServerConfig, defaultConfig };

type environmentName = "test" | "client" | "server" | "common";
type subEnvironmentName = "client" | "server" | "";

export function getConfig(environment: environmentName, subEnvironment: subEnvironmentName = "") {
    const subEnv = capitalize(subEnvironment || "") as "Client" | "Server";
    let config: typeof defaultConfig | typeof clientConfig | typeof serverConfig | typeof testClientConfig | typeof testServerConfig = defaultConfig;
    if (environment === "client") config = clientConfig;
    if (environment === "server") config = serverConfig;
    if (environment === "test" && subEnvironment) config = configs[`${environment}${subEnv}Config`];
    return config;
}

export function getEnvironmentBasePath(environment: environmentName, subEnvironment: subEnvironmentName = "") {
    const pathParts = [arp.path];
    if (environment === "test") {
        pathParts.push("tests", "unit", subEnvironment);
    } else pathParts.push("src", environment);
    return path.resolve(path.join(...pathParts));
}

export function isType(value: unknown): value is ts.Type {
    return Boolean(value && "flags" in value && "objectFlags" in value);
}

export function isCustomType(node?: ts.TypeNode): node is ts.TypeReferenceNode {
    return Boolean(node && ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName) && (node.typeName.escapedText ?? "") in customTypes);
}

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

export function isArray(property: ts.PropertyDeclaration | ts.PropertySignature, typeNode?: ts.TypeNode) {
    const kind = typeNode?.kind || property.initializer?.kind;
    const isArrayType = kind && (kind & ts.SyntaxKind.ArrayType) === ts.SyntaxKind.ArrayType;
    const isArrayLiteralExpression = kind && (kind & ts.SyntaxKind.ArrayLiteralExpression) === ts.SyntaxKind.ArrayLiteralExpression;
    return Boolean(isArrayType || isArrayLiteralExpression);
}

export function isTupleType(node?: ts.TypeNode | ts.PropertyDeclaration | ts.PropertySignature): node is ts.TupleTypeNode {
    return Boolean(node && ts.isTupleTypeNode(node));
}

export function isOptional(node?: ts.TypeNode | ts.PropertyDeclaration | ts.PropertySignature): node is ts.OptionalTypeNode {
    return Boolean(node && ts.isOptionalTypeNode(node));
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

export function isInterface(type: ts.Type, property: ts.PropertyDeclaration | ts.PropertySignature, sourceFile: ts.SourceFile, environment: environmentName, subEnvironment: subEnvironmentName = ""): boolean {
    return Boolean(property.type && (
        type.isClassOrInterface() && !type.isClass() ||
        !type.isClass() && ts.isTypeReferenceNode(property.type) && !isDate(type, property) && !isModel(type, sourceFile, environment, subEnvironment) ||
        property.questionToken && isUnion(type) && isInterface((<ts.UnionType>type).types[1], property, sourceFile, environment, subEnvironment)) ||
        hasTypeLiteral(property));
}

export function isTypeParameter(type: ts.Type): type is ts.TypeParameter {
    return (type.flags & ts.TypeFlags.TypeParameter) === ts.TypeFlags.TypeParameter;
}

export function getSourceFileByPath(sourceFile: ts.SourceFile, importPath: string, environment: environmentName, subEnvironment: subEnvironmentName = "", skipValidModelCheck = false, extension = "ts"): [ts.SourceFile | undefined, ts.Program] {
    if (importPath.startsWith('"') && importPath.endsWith('"')) importPath = importPath.substring(1, importPath.length - 1);

    const configBasePath = getEnvironmentBasePath(environment, subEnvironment);
    const subProgram = programFromConfig(path.resolve(path.join(configBasePath, "tsconfig.json")));

    let resolvedPath = "";
    if (importPath.startsWith("~")) {
        resolvedPath = resolveImportPath(importPath, environment, subEnvironment, extension);
    } else if (importPath.startsWith(".")) {
        resolvedPath = path.resolve(path.relative(path.dirname(sourceFile.fileName), importPath));
    } else[undefined, subProgram];
    const possibleSourceFiles = subProgram.getSourceFiles().filter(skipValidModelCheck ? () => true : isValidSourceFile);
    return [possibleSourceFiles.find((sourceFile) => !path.relative(resolvedPath, sourceFile.fileName)), subProgram];
}

export function isModel(type: ts.Type, sourceFile: ts.SourceFile, environment: environmentName, subEnvironment: subEnvironmentName = "") {

    function isMaybeModelType(): boolean {
        for (const statement of sourceFile.statements) {
            if (!ts.isImportDeclaration(statement)) continue;
            const importClause = statement.importClause;
            const moduleSpecifier = statement.moduleSpecifier;

            if (!importClause?.name || !type.aliasSymbol) continue;
            if (importClause.name.getText() !== type.aliasSymbol.name) continue;

            const importPath = moduleSpecifier.getText();
            const [newSourceFile] = getSourceFileByPath(sourceFile, importPath, environment, subEnvironment);
            if (!newSourceFile) continue;

            for (const statement of newSourceFile.statements) {
                if (!ts.isClassDeclaration(statement)) continue;
                if (!isDefaultExported(statement)) continue;
                return true;
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
        "/src/server/lib/BaseModel.ts",
        "/tests/unit/client/models",
        "/tests/unit/server/models"
    ];
    return validSourceFiles.some((path) => sourceFile.fileName.includes(path));
}

export function isValidDecoratorImport(identifier: ts.Identifier, typeChecker: ts.TypeChecker) {
    const symbol = typeChecker.getSymbolAtLocation(identifier);
    if (!symbol) return false;

    const declaration = symbol.declarations?.[0];
    const importDeclaration = declaration?.parent?.parent?.parent;
    if (!importDeclaration || !ts.isImportDeclaration(importDeclaration)) return false;
    if (!ts.isStringLiteral(importDeclaration.moduleSpecifier)) return false;

    const importPath = importDeclaration.moduleSpecifier.text;
    const validAttrImports = ["~client/utils/decorators", "~common/utils/decorators", "~server/utils/decorators", "~env/utils/decorators"];
    return validAttrImports.some((attrImport) => importPath === attrImport);
}

export function isValidModelIdentifier(identifier: ts.Identifier, typeChecker: ts.TypeChecker) {
    const isValidImport = isValidDecoratorImport(identifier, typeChecker);
    return isValidImport && identifier.escapedText === "Model";
}

export function isValidAttrIdentifier(identifier: ts.Identifier, typeChecker: ts.TypeChecker) {
    const isValidImport = isValidDecoratorImport(identifier, typeChecker);
    return isValidImport && identifier.escapedText === "Attr";
}

export function isInEnvironment(environment: `~${environmentName}` | environmentName, pathString: string, subEnvironment: subEnvironmentName = "", substitute = "") {
    if (!environment.startsWith("~")) environment = `~${environment}` as `~${environmentName}`;
    if (pathString.startsWith("~")) pathString = resolveImportPath(pathString, environment.replace("~", "") as environmentName, subEnvironment);
    const relativeTo = path.dirname(resolveImportPath(environment, environment.replace("~", "") as environmentName, subEnvironment)).replace(substitute, "");
    const relative = path.relative(relativeTo, pathString);
    return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

export function resolveImportPath(importPath: string, environment: environmentName, subEnvironment: subEnvironmentName = "", extension = "ts") {
    if (importPath.startsWith('"') && importPath.endsWith('"')) importPath = importPath.substring(1, importPath.length - 1);
    const pathParts = importPath.split("/");
    const entryPoint = pathParts.shift() as `~${environmentName}`;
    const fileName = `${pathParts.pop()}.${extension}`;

    const environmentBasePath = getEnvironmentBasePath(environment, subEnvironment);
    const paths = getConfig(environment, subEnvironment).compilerOptions.paths;

    const relativePaths = (paths as Record<string, string[]>)[`${entryPoint}/*`]; //?.[0].replace("*", "") || "";
    for (let relativePath of relativePaths) {
        relativePath = relativePath.replace("*", "");
        const fullPath = path.resolve(path.join(environmentBasePath, relativePath, ...pathParts, fileName));
        if (fs.existsSync(fullPath)) return fullPath;
    }
    return "";
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
