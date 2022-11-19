import { isPropertyDeclaration, isPropertySignature, isParenthesizedTypeNode, isParameter } from "../../utils/SyntaxKind";
import { createRule } from "../lib/RuleContext";
import type ts from "typescript";

export const TypeParenthesized = createRule({
    name: "Type-Parenthesized",
    type: ["Attr", "Arg", "Query", "Mutation"],
    detect(program, sourceFile, node) {
        let nodeToCheck: ts.Node | undefined = node;
        if (isPropertyDeclaration(node) || isPropertySignature(node) || isParameter(node)) nodeToCheck = node.type;
        if (!nodeToCheck) return false;
        if (isParenthesizedTypeNode(nodeToCheck)) return nodeToCheck;
        return false;
    },
    emitType(program, sourceFile, node, next) {
        return next(node.type);
    }
});
