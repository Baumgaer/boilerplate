import * as path from "path";
import minimatch from "minimatch";
import {
    resolveModuleName,
    canHaveModifiers,
    getModifiers,
    sys,
    parseConfigFileTextToJson,
    parseJsonConfigFileContent,
    createProgram,
    canHaveDecorators,
    getDecorators as tsGetDecorators
} from "typescript";
import {
    isNode,
    isImportDeclaration,
    isExportDeclaration,
    isNamespaceImportNode,
    isIdentifierNode,
    isNamedImportsNode,
    isExportKeyword,
    isDefaultKeyword,
    isTypeReferenceNode,
    isNewExpression,
    isNamedExportsNode,
    isTypeNode,
    isPropertyDeclaration,
    isPropertySignature
} from "./SyntaxKind";
import type { environment } from "../@types/Transformer";
import type { TypeReturn, TSNodeNames } from "../@types/Utils";
import type * as ts from "typescript";

export function getTypeFromTypeNode(checker: ts.TypeChecker, node?: ts.TypeNode): TypeReturn {
    if (!node) return undefined;
    return checker.getTypeFromTypeNode(node);
}

export function getTypeFromExpression(checker: ts.TypeChecker, node?: ts.Expression): TypeReturn {
    if (!node) return undefined;
    return checker.getTypeAtLocation(node);
}

export function getTypeFromNode(checker: ts.TypeChecker, node: ts.Node): TypeReturn {
    if (isPropertyDeclaration(node) || isPropertySignature(node)) {
        if (node.type) return getTypeFromTypeNode(checker, node.type);
        if (node.initializer) return getTypeFromExpression(checker, node.initializer);
    }
    if (isTypeNode(node)) return checker.getTypeFromTypeNode(node);
    return checker.getTypeAtLocation(node);
}

export function getDecorators(node: ts.Node) {
    return (canHaveDecorators(node) && tsGetDecorators(node)) || [];
}

export function hasDecorator(node: ts.Node, name: string) {
    return getDecorators(node).some((decorator) => decorator.expression.getText(decorator.getSourceFile()).includes(name));
}

export function resolveTypeReferenceTo<T extends TSNodeNames>(program: ts.Program, node: ts.TypeReferenceNode | ts.NewExpression | ts.Identifier, typeDeclarationName: T): ts.Statement | undefined {

    function findTypeRecursive(sourceFile: ts.SourceFile, typeName: string, isDefaultExport = false): ts.Statement | undefined {

        function getSourceFileByImport(declaration: ts.ImportDeclaration | ts.ExportDeclaration) {
            let modulePath = declaration.moduleSpecifier?.getText(sourceFile);
            if (!modulePath) return undefined;
            if (modulePath.includes('"')) modulePath = modulePath.replaceAll('"', '');
            const result = resolveModuleName(modulePath, sourceFile.fileName, program.getCompilerOptions(), sys);
            const fileName = result.resolvedModule?.resolvedFileName;
            if (!fileName) return undefined;
            return program.getSourceFile(fileName);
        }

        function processImportDeclaration(declaration: ts.ImportDeclaration): ts.Statement | undefined {
            const clause = declaration.importClause as ts.ImportClause;

            if (isNamedImportsNode(clause.namedBindings)) { // import * as foo from "bar"
                for (const element of clause.namedBindings?.elements || []) {
                    if (element.name.escapedText.toString() !== typeName) continue;

                    const newSourceFile = getSourceFileByImport(declaration);
                    if (!newSourceFile) return undefined;

                    const newTypeName = element.propertyName?.escapedText?.toString() || element.name.escapedText.toString();
                    return findTypeRecursive(newSourceFile, newTypeName);
                }
            } else if (isIdentifierNode(clause.name)) { // import foo from "bar"
                if (clause.name.escapedText.toString() !== typeName) return undefined;

                const newSourceFile = getSourceFileByImport(declaration);
                if (!newSourceFile) return undefined;

                return findTypeRecursive(newSourceFile, "", true);
            } else if (isNamespaceImportNode(clause.namedBindings)) { // import { foo, bar} from "baz"
                if (clause.namedBindings?.name.escapedText?.toString() !== typeName) return undefined;

                const newSourceFile = getSourceFileByImport(declaration);
                if (!newSourceFile) return undefined;

                return findTypeRecursive(newSourceFile, typeName);
            }

            return undefined;
        }

        function processExportDeclaration(declaration: ts.ExportDeclaration): ts.Statement | undefined {
            const clause = declaration.exportClause;

            if (!clause) { // export * from "foo";
                const newSourceFile = getSourceFileByImport(declaration);
                if (!newSourceFile) return undefined;
                return findTypeRecursive(newSourceFile, typeName);
            } else if (isNamedExportsNode(clause)) { // export { foo, bar } from "baz";
                for (const element of clause.elements) {
                    if (element.name.escapedText.toString() !== typeName) continue;
                    const newSourceFile = getSourceFileByImport(declaration);
                    if (!newSourceFile) return undefined;
                    const newTypeName = element.propertyName?.escapedText?.toString() || element.name.escapedText.toString();
                    return findTypeRecursive(newSourceFile, newTypeName);
                }
            }
        }

        const importDeclarations: ts.ImportDeclaration[] = [];
        const exportDeclarations: ts.ExportDeclaration[] = [];

        for (const statement of sourceFile.statements) {
            if (isImportDeclaration(statement)) importDeclarations.push(statement);
            if (isExportDeclaration(statement)) {
                if (statement.moduleSpecifier) {
                    exportDeclarations.push(statement);
                } else if (isNamedExportsNode(statement.exportClause)) {
                    for (const element of statement.exportClause.elements) {
                        const compareName = element.propertyName?.escapedText?.toString() || element.name.escapedText.toString();
                        if (compareName === typeName) return findTypeRecursive(sourceFile, element.name.escapedText.toString());
                    }
                }
            }

            if (!canHaveModifiers(statement)) continue;

            const isExported = getModifiers(statement)?.some((modifier) => isExportKeyword(modifier));
            if (!isExported || !isNode(typeDeclarationName, statement)) continue;

            if (isDefaultExport) {
                const isDefault = getModifiers(statement)?.some((modifier) => isDefaultKeyword(modifier));
                if (!isDefault) continue;

                return statement;
            } else if ("name" in statement && statement.name?.getText(sourceFile) === typeName) {
                return statement;
            }
        }

        for (const importDeclaration of importDeclarations) {
            const result = processImportDeclaration(importDeclaration);
            if (result) return result;
        }
        for (const exportDeclaration of exportDeclarations) {
            const result = processExportDeclaration(exportDeclaration);
            if (result) return result;
        }

        return undefined;
    }

    const sourceFile = node.getSourceFile();
    let typeName = "";
    if (isTypeReferenceNode(node)) {
        typeName = node.typeName.getText(sourceFile);
    } else if (isNewExpression(node)) {
        typeName = node.expression.getText(sourceFile);
    } else typeName = node.getText(sourceFile);

    return findTypeRecursive(sourceFile, typeName);
}

export function programFromConfig(configFilePath: string) {
    const configFile = sys.readFile(configFilePath);
    if (!configFile) throw new Error("No configuration found");

    // basically a copy of https://github.com/Microsoft/TypeScript/blob/3663d400270ccae8b69cbeeded8ffdc8fa12d7ad/src/compiler/tsc.ts -> parseConfigFile
    const result = parseConfigFileTextToJson(configFilePath, configFile);
    const configObject = result.config;

    // Normalize configuration for parsing schema only
    const configParseResult = parseJsonConfigFileContent(configObject, sys, path.dirname(configFilePath), {}, path.basename(configFilePath));
    const options = configParseResult.options;
    options.noEmit = true;
    delete options.out;
    delete options.outDir;
    delete options.outFile;
    delete options.declaration;
    delete options.declarationDir;
    delete options.declarationMap;

    const program = createProgram({
        rootNames: configParseResult.fileNames,
        options,
        projectReferences: configParseResult.projectReferences
    });
    return program;
}

export function isInEnvironmentalPath(program: ts.Program, tsConfigPath: string, environment: environment, environmentalPath: string, filePath: string) {
    const environments = [environment, "common", "env"];
    const aliases = program.getCompilerOptions().paths as Record<string, string[]>;

    return Object.keys(aliases).filter((alias) => {
        return environments.some((environment) => alias.startsWith(`~${environment}`));
    }).some((alias) => {
        return aliases[alias].some((pathPattern) => {
            pathPattern = path.join(path.dirname(tsConfigPath), pathPattern).replaceAll("\\", "/");
            pathPattern = pathPattern.replace(`/${environment}/`, `/${environment}/${environmentalPath}`);
            // To avoid double replacing for common environment
            if (environment !== "common") pathPattern = pathPattern.replace("/common/", `/common/${environmentalPath}`);
            if (path.extname(environmentalPath)) {
                // in case of file remove those characters from the end of the pattern
                const charsToRemove = ["/", "\\", "{", "}", "*", ".", "!", "?", "[", "]"];
                while (charsToRemove.includes(pathPattern.substring(pathPattern.length - 1))) {
                    pathPattern = pathPattern.substring(0, pathPattern.length - 1);
                }
            }
            const match = minimatch(filePath, pathPattern);
            return match;
        });
    });
}
