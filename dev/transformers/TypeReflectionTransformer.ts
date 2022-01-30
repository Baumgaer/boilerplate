import * as ts from "typescript";
import arp from "app-root-path";
import path from "path";
import clientConfig from "./../../src/client/tsconfig.json";

let typeChecker!: ts.TypeChecker;

function programFromConfig(configFileName: string) {
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

export default function transformer(program: ts.Program) {

    typeChecker = program.getTypeChecker();

    return (context: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {

        function isValidSourceFile(sourceFile: ts.SourceFile): boolean {
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

        function isValidAttrIdentifier(identifier: ts.Identifier) {
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

        function processCallExpression(node: ts.CallExpression, sourceFile: ts.SourceFile) {
            if (!ts.isDecorator(node.parent)) return node;
            if (!ts.isPropertyDeclaration(node.parent.parent)) return node;
            if (ts.isIdentifier(node.expression) && !isValidAttrIdentifier(node.expression)) return node;

            const metadataJson = processAttr(node.parent.parent, sourceFile);
            const argument = <ts.ObjectLiteralExpression>node.arguments[0];

            let objectLiteralExpression = null;
            if (!argument) {
                objectLiteralExpression = ts.factory.createObjectLiteralExpression([ts.factory.createPropertyAssignment(
                    ts.factory.createIdentifier("metadataJson"),
                    ts.factory.createStringLiteral(metadataJson)
                )], false);
            } else {
                objectLiteralExpression = ts.factory.updateObjectLiteralExpression(
                    argument,
                    argument.properties.concat([ts.factory.createPropertyAssignment(
                        ts.factory.createIdentifier("metadataJson"),
                        ts.factory.createStringLiteral(metadataJson)
                    )])
                );
            }
            return ts.factory.updateCallExpression(node, node.expression, node.typeArguments, [objectLiteralExpression]);
        }

        function processAttr(attr: ts.PropertyDeclaration, sourceFile: ts.SourceFile) {

            const alias = attr.name.getText();
            console.info(`processing attribute ${alias}`);
            const type = resolveType(typeChecker.getTypeAtLocation(attr), attr, sourceFile);

            console.log(attr.name.getText(), JSON.stringify(type));

            const isRequired = !attr.questionToken && !attr.initializer || attr.exclamationToken && !attr.initializer;
            const isReadOnly = attr.modifiers?.some((modifier) => modifier?.kind === ts.SyntaxKind.ReadonlyKeyword);
            const isInternal = attr.modifiers?.every((modifier) => modifier?.kind !== ts.SyntaxKind.PublicKeyword);

            return JSON.stringify({ isRequired, isReadOnly, isInternal, type, alias });
        }

        function resolveType(type: ts.Type, attr: ts.PropertyDeclaration, sourceFile: ts.SourceFile) {

            let typeNode = attr.type;

            // NORMALIZE TYPE
            if (typeNode?.kind === ts.SyntaxKind.ParenthesizedType) {
                typeNode = (<ts.ParenthesizedTypeNode>typeNode).type;
                type = typeChecker.getTypeAtLocation(typeNode);
            }

            // RESOLVE PRIMITIVE TYPES
            if (type.flags === ts.TypeFlags.Null) return { isNull: true };
            if (type.flags === ts.TypeFlags.Undefined) return { isUndefined: true };
            if (type.flags === ts.TypeFlags.String) return { identifier: "String" };
            if (type.flags === ts.TypeFlags.Number) return { identifier: "Number" };
            if (type.flags === ts.TypeFlags.Union + ts.TypeFlags.Boolean || type.flags === ts.TypeFlags.BooleanLiteral) return { identifier: "Boolean" };
            if (type.flags === ts.TypeFlags.NumberLiteral || type.flags === ts.TypeFlags.StringLiteral) {
                const isStringLiteral = type.flags === ts.TypeFlags.StringLiteral;
                const isNumberLiteral = type.flags === ts.TypeFlags.NumberLiteral;
                return { isLiteral: true, isStringLiteral, isNumberLiteral, value: (<ts.LiteralType>type).value };
            }

            // RESOLVE MODEL TYPE
            if (type.flags === ts.TypeFlags.TypeParameter || type.flags === ts.TypeFlags.Object) {
                const symbol = type.symbol;
                if (symbol?.flags === ts.SymbolFlags.Class && isValidSourceFile(<ts.SourceFile>symbol.valueDeclaration.parent)) {
                    return { identifier: (<ts.ClassDeclaration>symbol.valueDeclaration).name.getText(), isModel: true };
                }
            }

            // RESOLVE UNIONS AND INTERSECTIONS
            if (type.flags === ts.TypeFlags.Union || type.flags === ts.TypeFlags.Intersection) {
                const isUnion = type.flags === ts.TypeFlags.Union;
                const isIntersection = type.flags === ts.TypeFlags.Intersection;

                const subTypes = [];
                for (const subType of (<ts.UnionOrIntersectionType>type).types) {
                    subTypes.push(resolveType(subType, attr, sourceFile));
                }
                return { isUnion, isIntersection, subTypes };
            }

            if (type.flags === ts.TypeFlags.Object) return resolveObjectType(type, attr, sourceFile);

            // RESOLVE ANY TYPE
            if (type.flags === ts.TypeFlags.Any) {
                if (isMaybeModelType(type, sourceFile)) return { identifier: typeChecker.typeToString(type), isModel: true };
                console.warn(`WARNING: Any type detected!`);
                return { isMixed: true };
            }

            return { isUnresolvedType: true };
        }

        function resolveObjectType(type: ts.Type, attr: ts.PropertyDeclaration, sourceFile: ts.SourceFile) {

            // RESOLVE ARRAY
            if (attr.type?.kind === ts.SyntaxKind.ArrayType || attr.initializer?.kind === ts.SyntaxKind.ArrayLiteralExpression) {
                if (attr.type) {
                    const elementType = typeChecker.getTypeAtLocation((<ts.ArrayTypeNode>attr.type).elementType);
                    return { isArray: true, subType: resolveType(elementType, attr, sourceFile) };
                }
                if (attr.initializer) {
                    const subTypes = [];
                    (<ts.ArrayLiteralExpression>attr.initializer).elements.forEach((element) => {
                        const subType = resolveType(typeChecker.getTypeAtLocation(element), attr, sourceFile);
                        subTypes.push(subType);
                    });
                    return { isArray: true, subType: { isUnion: true, subTypes } };
                }
            }

            // RESOLVE DATE
            if (attr.type?.kind === ts.SyntaxKind.TypeReference || attr.initializer?.kind === ts.SyntaxKind.CallExpression || attr.initializer?.kind === ts.SyntaxKind.NewExpression) {
                if ((<ts.Identifier>(<ts.TypeReferenceNode>attr.type)?.typeName)?.escapedText === "Date") {
                    return { identifier: "Date" };
                }

                if ((<ts.Identifier>(<ts.CallExpression | ts.NewExpression>attr.initializer)?.expression)?.escapedText === "Date") {
                    return { identifier: "Date" };
                }
            }
        }

        function isMaybeModelType(type: ts.Type, sourceFile: ts.SourceFile): boolean {
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

        function resolveImportPath(importPath: string) {
            if (importPath.startsWith('"') && importPath.endsWith('"')) importPath = importPath.substring(1, importPath.length - 1);
            const pathParts = importPath.split("/");
            const entryPoint = pathParts.shift();
            const fileName = pathParts.pop() + ".ts";
            const relativePath = clientConfig.compilerOptions.paths[`${entryPoint}/*`][0].replace("*", "");
            return path.resolve(path.join(arp.path, "src", "client", relativePath, ...pathParts, fileName));
        }

        function isDefaultExported(declaration: ts.ClassDeclaration) {
            return declaration.modifiers?.[0].kind === ts.SyntaxKind.ExportKeyword && declaration.modifiers?.[1].kind === ts.SyntaxKind.DefaultKeyword;
        }

        return (sourceFile) => {
            if (!isValidSourceFile(sourceFile)) return sourceFile;
            console.log("processing file:", sourceFile.fileName);
            const visitor = (node: ts.Node): ts.Node => {
                if (ts.isCallExpression(node)) return processCallExpression(node, sourceFile);
                return ts.visitEachChild(node, visitor, context);
            };
            return ts.visitNode(sourceFile, visitor);
        };
    };
}
