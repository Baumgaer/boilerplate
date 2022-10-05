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
        if (isParenthesizedTypeNode(nodeToCheck)) return nodeToCheck;
        return false;
    },
    emitType(program, sourceFile, node, next) {
        return next(node.type);
    }
});
