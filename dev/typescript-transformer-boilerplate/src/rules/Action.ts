import { createRule } from "../lib/RuleContext";
import { isMethodDeclaration } from "../utils/SyntaxKind";
import type ts from "typescript";

export const Action = createRule({
    name: "Action",
    type: ["Query", "Mutation"],
    detect(program, sourceFile, node, matchedRules) {
        if (!matchedRules.includes("Action") && isMethodDeclaration(node)) return node;
        return false;
    },
    emitMetadata(program, sourceFile, node) {
        return {
            name: (node.name as ts.Identifier).escapedText
        };
    },
    emitType(program, sourceFile, node, next) {
        if (node.type) return next(node.type);
        const checker = program.getTypeChecker();
        const signature = checker.getSignatureFromDeclaration(node);
        if (signature) {
            const type = checker.getReturnTypeOfSignature(signature);
            const typeNode = checker.typeToTypeNode(type, node, undefined);
            if (typeNode) return next(typeNode);
        }
    }
});
