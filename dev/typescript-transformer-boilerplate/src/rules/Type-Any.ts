import { createRule } from "../lib/RuleContext";
import { isPropertyDeclaration, isParameter, isPropertySignature, isAnyKeyword } from "../utils/SyntaxKind";
import type ts from "typescript";

export const TypeAny = createRule({
    name: "Type-Any",
    type: ["Attr", "Arg", "Query", "Mutation"],
    detect(program, sourceFile, node, matchedRules) {
        if (matchedRules.length) return false;
        return node;
    },
    emitType(program, sourceFile, node) {
        let nodeToCheck: ts.Node | undefined = node;
        if (isPropertyDeclaration(node) || isPropertySignature(node) || isParameter(node)) nodeToCheck = node.type;

        const anyKeyword = isAnyKeyword(nodeToCheck);
        return {
            isMixed: Boolean(anyKeyword),
            isUnresolved: !anyKeyword
        };
    }
});
