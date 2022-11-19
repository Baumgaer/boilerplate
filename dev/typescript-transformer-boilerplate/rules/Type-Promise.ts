import { isPropertyDeclaration, isPropertySignature, isParameter, isTypeReferenceNode, isIdentifierNode } from "../../utils/SyntaxKind";
import { createRule } from "../lib/RuleContext";
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
        if (node.typeArguments) return next(node.typeArguments[0]);
    }
});
