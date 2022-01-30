import * as ts from "typescript";
import arp from "app-root-path";
import path from "path";
import * as utils from "./../utils";

let typeChecker!: ts.TypeChecker;

export default function transformer(program: ts.Program) {

    typeChecker = program.getTypeChecker();

    return (context: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {

        function processCallExpression(node: ts.CallExpression, sourceFile: ts.SourceFile) {
            if (!ts.isDecorator(node.parent)) return node;
            if (!ts.isPropertyDeclaration(node.parent.parent)) return node;
            if (ts.isIdentifier(node.expression) && !utils.isValidAttrIdentifier(node.expression, typeChecker)) return node;

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

        function resolveType(type: ts.Type, attr: ts.PropertyDeclaration | ts.PropertySignature, sourceFile: ts.SourceFile) {

            let typeNode = attr.type;

            // NORMALIZE TYPE
            if (typeNode?.kind === ts.SyntaxKind.ParenthesizedType) {
                typeNode = (<ts.ParenthesizedTypeNode>typeNode).type;
                type = typeChecker.getTypeAtLocation(typeNode);
            }

            // RESOLVE PRIMITIVE TYPES
            if (utils.isNull(type)) return { isNull: true };
            if (utils.isUndefined(type)) return { isUndefined: true };
            if (utils.isString(type)) return { identifier: "String" };
            if (utils.isNumber(type)) return { identifier: "Number" };
            if (utils.isBoolean(type)) return { identifier: "Boolean" };
            if (utils.isLiteral(type)) {
                const isStringLiteral = utils.isStringLiteral(type);
                const isNumberLiteral = utils.isNumberLiteral(type);
                return { isLiteral: true, isStringLiteral, isNumberLiteral, value: (<ts.LiteralType>type).value };
            }

            // RESOLVE MODEL TYPE
            if (type.flags === ts.TypeFlags.TypeParameter || type.flags === ts.TypeFlags.Object) {
                const symbol = type.symbol;
                if (symbol?.flags === ts.SymbolFlags.Class && utils.isValidSourceFile(<ts.SourceFile>symbol.valueDeclaration.parent)) {
                    return { identifier: (<ts.ClassDeclaration>symbol.valueDeclaration).name.getText(), isModel: true };
                }
            }

            // RESOLVE UNIONS AND INTERSECTIONS
            if (utils.isUnionOrIntersection(type)) {
                const isUnion = utils.isUnion(type);
                const isIntersection = utils.isIntersection(type);

                const subTypes = [];
                for (const subType of (<ts.UnionOrIntersectionType>type).types) {
                    subTypes.push(resolveType(subType, attr, sourceFile));
                }
                return { isUnion, isIntersection, subTypes };
            }

            if (utils.isObject(type)) {
                if (utils.isInterface(type, attr)) {
                    return resolveInterface(<ts.TypeReferenceNode>typeNode, sourceFile);
                }
                return resolveObjectType(type, attr, sourceFile);
            }

            // RESOLVE ANY TYPE
            if (utils.isAny(type)) {
                if (isMaybeModelType(type, sourceFile)) return { identifier: typeChecker.typeToString(type), isModel: true };
                if (utils.isDate(type, attr)) return { identifier: "Date" };
                console.warn(`WARNING: Any type detected!`);
                return { isMixed: true };
            }

            return { isUnresolvedType: true };
        }

        function resolveInterface(typeNode: ts.TypeReferenceNode, sourceFile: ts.SourceFile) {
            const identifier = typeNode.typeName;
            const symbol = typeChecker.getSymbolAtLocation(identifier);
            const members = {};
            symbol.members?.forEach((member) => {
                const signature = <ts.PropertySignature>member.valueDeclaration;
                const type = typeChecker.getTypeAtLocation(signature);
                members[member.getName()] = resolveType(type, signature, sourceFile);
            });
            return { isInterface: true, members };
        }

        function resolveObjectType(type: ts.Type, attr: ts.PropertyDeclaration | ts.PropertySignature, sourceFile: ts.SourceFile) {

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
                    const subProgram = utils.programFromConfig(path.resolve(path.join(arp.path, "src", "client", "tsconfig.json")));

                    const resolvedPath = utils.resolveImportPath(importPath);
                    const possibleSourceFiles = subProgram.getSourceFiles().filter(utils.isValidSourceFile);
                    const newSourceFile = possibleSourceFiles.find((sourceFile) => !path.relative(resolvedPath, sourceFile.fileName));
                    if (!newSourceFile) continue;

                    for (const statement of newSourceFile.statements) {
                        if (!ts.isClassDeclaration(statement)) continue;
                        if (!utils.isDefaultExported(statement)) continue;
                        return true;
                    }
                }
            }
            return false;
        }

        return (sourceFile) => {
            if (!utils.isValidSourceFile(sourceFile)) return sourceFile;
            console.log("processing file:", sourceFile.fileName);
            const visitor = (node: ts.Node): ts.Node => {
                if (ts.isCallExpression(node)) return processCallExpression(node, sourceFile);
                return ts.visitEachChild(node, visitor, context);
            };
            return ts.visitNode(sourceFile, visitor);
        };
    };
}
