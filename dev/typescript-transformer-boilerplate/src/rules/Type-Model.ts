import { createRule } from "../lib/RuleContext";
import { isTypeReferenceNode, isNewExpression, isIdentifierNode, isPropertyDeclaration, isPropertySignature, isParameter } from "../utils/SyntaxKind";
import { isObjectType, isAnyType, isClassType, isInterfaceType } from "../utils/Type";
import { getTypeFromNode, resolveTypeReferenceTo, isInEnvironmentalPath } from "../utils/utils";
import type ts from "typescript";

function getTypeContainingNode(node: ts.Node) {
    if (isPropertyDeclaration(node) || isPropertySignature(node) || isParameter(node)) {
        if (isTypeReferenceNode(node.type)) {
            return node.type;
        } else if (isNewExpression(node.initializer) || isIdentifierNode(node.initializer)) return node.initializer;
    }
    if (!isNewExpression(node) && !isIdentifierNode(node) && !isTypeReferenceNode(node)) return undefined;
    return node;
}

export const TypeModel = createRule({
    name: "Type-Model",
    type: ["Attr", "Arg", "Query", "Mutation"],
    detect(program, sourceFile, node) {

        let nodeToCheck: ts.Identifier | ts.Node | ts.NewExpression | undefined = node;
        if (isPropertyDeclaration(node) || isPropertySignature(node) || isParameter(node)) nodeToCheck = node.type;
        if (!nodeToCheck) return false;

        const checker = program.getTypeChecker();
        const type = getTypeFromNode(checker, nodeToCheck);
        if (!isObjectType(type) && !isAnyType(type) && !isClassType(type) || isInterfaceType(type) && !isClassType(type)) return false;

        const typeContainingNode = getTypeContainingNode(nodeToCheck);
        if (!typeContainingNode) return false;

        const resolvedNode = resolveTypeReferenceTo(program, typeContainingNode, "ClassDeclaration");
        if (!resolvedNode) return false;

        const filePath = (resolvedNode.getSourceFile()?.fileName || "").replaceAll("\\", "/");
        if (!filePath) return false;

        if (isInEnvironmentalPath(program, this.tsConfigPath, this.environment, "models/", filePath)) {
            return resolvedNode as ts.ClassDeclaration;
        }
        return false;
    },
    emitType(program, sourceFile, node) {
        return {
            identifier: node.name?.getText(node.getSourceFile()),
            isObjectType: true,
            isModel: true
        };
    }
});
