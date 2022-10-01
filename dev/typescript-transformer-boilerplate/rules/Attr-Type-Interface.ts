import { isTypeReferenceNode, isNewExpression, isIdentifierNode } from "../../utils/SyntaxKind";
import { isObjectType, isAnyType, isInterfaceType } from "../../utils/Type";
import { getTypeFromPropertyDeclaration, resolveTypeReferenceTo } from "../../utils/utils";
import { createRule } from "../lib/RuleContext";
import type ts from "typescript";

export const AttrTypeInterface = createRule({
    name: "Attr-Type-Interface",
    type: "Attr",
    detect(program, sourceFile, node) {
        if (!isTypeReferenceNode(node.type)) return false;

        const checker = program.getTypeChecker();
        const type = getTypeFromPropertyDeclaration(checker, node);
        if (!isObjectType(type) && !isAnyType(type) && !isInterfaceType(type)) return false;

        let nodeToCheck: ts.Identifier | ts.TypeReferenceNode | ts.NewExpression | undefined;
        if (isTypeReferenceNode(node.type)) {
            nodeToCheck = node.type;
        } else if (isNewExpression(node.initializer) || isIdentifierNode(node.initializer)) nodeToCheck = node.initializer;
        if (!nodeToCheck) return false;

        const resolvedNode = resolveTypeReferenceTo(program, nodeToCheck, "InterfaceDeclaration");
        if (!resolvedNode) return false;

        const filePath = resolvedNode.getSourceFile()?.fileName;
        if (!filePath) return false;

        return true;
    },
    emitType(program, sourceFile, node) {
        let nodeToCheck: ts.Identifier | ts.TypeReferenceNode | ts.NewExpression | undefined = node.type as ts.TypeReferenceNode;
        if (!nodeToCheck && isNewExpression(node.initializer) || isIdentifierNode(node.initializer)) nodeToCheck = node.initializer;
        const resolvedNode = resolveTypeReferenceTo(program, nodeToCheck, "InterfaceDeclaration") as ts.InterfaceDeclaration;

        return {
            identifier: resolvedNode.name?.getText(resolvedNode.getSourceFile()),
            isObjectType: true,
            isInterface: true
        };
    }
});
