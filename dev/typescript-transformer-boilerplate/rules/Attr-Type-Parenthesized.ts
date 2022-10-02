import { isPropertyDeclaration, isPropertySignature, isParenthesizedTypeNode } from "../../utils/SyntaxKind";
import { createRule } from "../lib/RuleContext";
import type ts from "typescript";

export const AttrTypeParenthesized = createRule({
    name: "Attr-Type-Parenthesized",
    type: "Attr",
    detect(program, sourceFile, node) {
        let nodeToCheck: ts.Node | undefined = node;
        if (isPropertyDeclaration(node) || isPropertySignature(node)) nodeToCheck = node.type;
        if (!nodeToCheck) return false;
        return isParenthesizedTypeNode(nodeToCheck);
    },
    emitType(program, sourceFile, node, next) {
        let nodeToCheck = node as ts.ParenthesizedTypeNode;
        if (isPropertyDeclaration(node) || isPropertySignature(node)) nodeToCheck = node.type as ts.ParenthesizedTypeNode;

        return next(nodeToCheck.type);
    }
});
