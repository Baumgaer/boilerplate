import * as ts from "typescript";
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

            const name = attr.name.getText();
            console.info(`processing attribute ${name}`);
            const type = resolveType(typeChecker.getTypeAtLocation(attr), attr, sourceFile);

            //console.log(attr.name.getText(), JSON.stringify(type));

            const isRequired = !attr.questionToken && !attr.initializer || attr.exclamationToken && !attr.initializer;
            const isReadOnly = attr.modifiers?.some((modifier) => modifier?.kind === ts.SyntaxKind.ReadonlyKeyword);
            const isInternal = attr.modifiers?.every((modifier) => modifier?.kind !== ts.SyntaxKind.PublicKeyword);
            const isLazy = utils.isPromise(attr.type);

            return JSON.stringify({ name, isInternal, isReadOnly, isRequired, isLazy, type });
        }

        function resolveType(type: ts.Type, attr: ts.PropertyDeclaration | ts.PropertySignature, sourceFile: ts.SourceFile, useAsTypeNode?: ts.TypeNode): any {

            let typeNode = useAsTypeNode ?? attr.type;

            // NORMALIZE TYPE
            if (utils.isParenthesizedType(typeNode)) {
                typeNode = (<ts.ParenthesizedTypeNode>typeNode).type;
                type = typeChecker.getTypeAtLocation(typeNode);
            }

            if (utils.isPromise(typeNode)) {
                if (!typeNode.typeArguments?.[0]) return { isUnresolvedType: true };
                typeNode = typeNode.typeArguments[0];
                type = typeChecker.getTypeAtLocation(typeNode);
            }

            if (utils.isNull(type)) return resolveNull();
            if (utils.isUndefined(type)) return resolveUndefined();
            if (utils.isString(type)) return resolveString();
            if (utils.isNumber(type)) return resolveNumber();
            if (utils.isBoolean(type)) return resolveBoolean();
            if (utils.isLiteral(type)) return resolveLiteral(type);
            if (utils.isModel(type, sourceFile)) return resolveModel(type);
            if (utils.isUnionOrIntersection(type)) return resolveUnionOrIntersection(type, attr, sourceFile);
            if (utils.isInterface(type, attr)) return resolveInterface(<ts.TypeReferenceNode | ts.TypeLiteralNode>typeNode, sourceFile);
            if (utils.isDate(type, attr)) return resolveDate();
            if (utils.isTupleType(typeNode)) return resolveTupleType(attr, sourceFile, typeNode);
            if (utils.isArray(attr)) return resolveArray(attr, sourceFile);
            if (utils.isAny(type)) return resolveAny();
            return { isUnresolvedType: true };
        }

        function resolveAny() {
            console.warn(`WARNING: Any type detected!`);
            return { isMixed: true };
        }

        function resolveNull() {
            return { isNull: true };
        }

        function resolveUndefined() {
            return { isUndefined: true };
        }

        function resolveString() {
            return { identifier: "String" };
        }

        function resolveNumber() {
            return { identifier: "Number" };
        }

        function resolveBoolean() {
            return { identifier: "Boolean" };
        }

        function resolveDate() {
            return { identifier: "Date" };
        }

        function resolveLiteral(type: ts.Type) {
            const isStringLiteral = utils.isStringLiteral(type);
            const isNumberLiteral = utils.isNumberLiteral(type);
            return { isLiteral: true, isStringLiteral, isNumberLiteral, value: (<ts.LiteralType>type).value };
        }

        function resolveModel(type: ts.Type) {
            return { isModel: true, identifier: typeChecker.typeToString(type) };
        }

        function resolveUnionOrIntersection(type: ts.Type, attr: ts.PropertyDeclaration | ts.PropertySignature, sourceFile: ts.SourceFile) {
            const isUnion = utils.isUnion(type);
            const isIntersection = utils.isIntersection(type);

            const subTypes = [];
            for (const subType of (<ts.UnionOrIntersectionType>type).types) {
                subTypes.push(resolveType(subType, attr, sourceFile));
            }
            return { isUnion, isIntersection, subTypes };
        }

        function resolveInterface(typeNode: ts.TypeReferenceNode | ts.TypeLiteralNode, sourceFile: ts.SourceFile) {

            let typeMembers: ts.SymbolTable | ts.NodeArray<ts.PropertySignature> | undefined;
            if (ts.isTypeReferenceNode(typeNode)) {
                const identifier = typeNode.typeName;
                const symbol = typeChecker.getSymbolAtLocation(identifier);
                typeMembers = symbol?.members;
            } else typeMembers = <ts.NodeArray<ts.PropertySignature>>typeNode.members;

            const members: Record<string, any> = {};
            typeMembers?.forEach((member: ts.Symbol | ts.PropertySignature) => {
                let signature: ts.PropertySignature;
                if ("valueDeclaration" in member) {
                    signature = <ts.PropertySignature>member.valueDeclaration;
                } else signature = <ts.PropertySignature>member;
                const type = typeChecker.getTypeAtLocation(signature);
                members[signature.name.getText()] = resolveType(type, signature, sourceFile);
            });

            return { isInterface: true, members };
        }

        function resolveTupleType(attr: ts.PropertyDeclaration | ts.PropertySignature, sourceFile: ts.SourceFile, typeNode: ts.TupleTypeNode) {
            const subTypes: any[] = [];
            typeNode.elements.forEach((element) => {
                const resolvedType = resolveType(typeChecker.getTypeAtLocation(element), attr, sourceFile, element);
                if (utils.isOptional(element)) {
                    subTypes.push({ isOptional: true, subType: resolvedType });
                } else subTypes.push(resolvedType);
            });
            return { isTuple: true, subTypes };
        }

        function resolveArray(attr: ts.PropertyDeclaration | ts.PropertySignature, sourceFile: ts.SourceFile) {
            if (attr.type) {
                const elementType = typeChecker.getTypeAtLocation((<ts.ArrayTypeNode>attr.type).elementType);
                return { isArray: true, subType: resolveType(elementType, attr, sourceFile) };
            }
            if (attr.initializer) {
                const subTypes: any[] = [];
                (<ts.ArrayLiteralExpression>attr.initializer).elements.forEach((element) => {
                    const subType = resolveType(typeChecker.getTypeAtLocation(element), attr, sourceFile);
                    subTypes.push(subType);
                });
                return { isArray: true, subType: { isUnion: true, subTypes } };
            }
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
