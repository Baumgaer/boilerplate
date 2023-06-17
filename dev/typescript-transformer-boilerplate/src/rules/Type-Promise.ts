import { createRule } from "../lib/RuleContext";
import { isPropertyDeclaration, isPropertySignature, isParameter, isTypeReferenceNode, isIdentifierNode } from "../utils/SyntaxKind";
import { getTypeArguments } from "../utils/utils";
import type ts from "typescript";

export const TypePromise = createRule({
    name: "Type-Promise",
    type: ["Attr", "Arg", "Query", "Mutation"],
    detect(program, sourceFile, node) {
        let nodeToCheck: ts.Node | undefined = node;
        if (isPropertyDeclaration(node) || isPropertySignature(node) || isParameter(node)) nodeToCheck = node.type || node.initializer;
        if (!nodeToCheck || !isTypeReferenceNode(nodeToCheck) || !("typeName" in nodeToCheck) || !isIdentifierNode(nodeToCheck.typeName) || nodeToCheck.typeName.escapedText !== "Promise") return false;
        return nodeToCheck;
    },
    emitMetadata() {
        return { isLazy: true };
    },
    emitType(program, sourceFile, node, next) {
        const typeArguments = getTypeArguments(node);
        if (typeArguments) return next(typeArguments[0]);
    }
});
