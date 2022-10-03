import { isTypeReferenceNode, isNewExpression, isIdentifierNode, isPropertyDeclaration, isPropertySignature } from "../../utils/SyntaxKind";
import { isObjectType, isAnyType, isClassType, isInterfaceType } from "../../utils/Type";
import { getTypeFromNode, resolveTypeReferenceTo, isInEnvironmentalPath } from "../../utils/utils";
import { createRule } from "../lib/RuleContext";
import type ts from "typescript";

function getTypeContainingNode(node: ts.Node) {
    if (isPropertyDeclaration(node) || isPropertySignature(node)) {
        if (isTypeReferenceNode(node.type)) {
            return node.type;
        } else if (isNewExpression(node.initializer) || isIdentifierNode(node.initializer)) return node.initializer;
    }
    if (!isNewExpression(node) && !isIdentifierNode(node) && !isTypeReferenceNode(node)) return undefined;
    return node;
}

export const AttrTypeModel = createRule({
    name: "Attr-Type-Model",
    type: "Attr",
    detect(program, sourceFile, node) {

        let nodeToCheck: ts.Identifier | ts.Node | ts.NewExpression | undefined = node;
        if (isPropertyDeclaration(node) || isPropertySignature(node)) nodeToCheck = node.type;
        if (!nodeToCheck) return false;

        const checker = program.getTypeChecker();
        const type = getTypeFromNode(checker, nodeToCheck);
        if (!isObjectType(type) && !isAnyType(type) && !isClassType(type) || isInterfaceType(type)) return false;

        if (isPropertyDeclaration(nodeToCheck) || isPropertySignature(nodeToCheck)) {
            if (isTypeReferenceNode(nodeToCheck.type)) {
                nodeToCheck = nodeToCheck.type;
            } else if (isNewExpression(nodeToCheck.initializer) || isIdentifierNode(nodeToCheck.initializer)) nodeToCheck = nodeToCheck.initializer;
        }
        nodeToCheck = getTypeContainingNode(nodeToCheck);
        if (!nodeToCheck) return false;

        const resolvedNode = resolveTypeReferenceTo(program, nodeToCheck as ts.TypeReferenceNode | ts.NewExpression | ts.Identifier, "ClassDeclaration");
        if (!resolvedNode) return false;

        const filePath = (resolvedNode.getSourceFile()?.fileName || "").replaceAll("\\", "/");
        if (!filePath) return false;

        return isInEnvironmentalPath(program, this.tsConfigPath, this.environment, "models/", filePath);
    },
    emitType(program, sourceFile, node) {
        const nodeToCheck = getTypeContainingNode(node) as ts.TypeReferenceNode | ts.NewExpression | ts.Identifier;
        const resolvedNode = resolveTypeReferenceTo(program, nodeToCheck, "ClassDeclaration") as ts.ClassDeclaration;

        return {
            identifier: resolvedNode.name?.getText(resolvedNode.getSourceFile()),
            isObjectType: true,
            isModel: true
        };
    }
});
