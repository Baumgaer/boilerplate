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
        console.log(1);
        if (node.type) return next(node.type);
        console.log(2);
        const checker = program.getTypeChecker();
        console.log(3);
        const signature = checker.getSignatureFromDeclaration(node);
        console.log(4);
        if (signature) {
            console.log(5);
            const type = checker.getReturnTypeOfSignature(signature);
            console.log(6);
            const typeNode = checker.typeToTypeNode(type, node, undefined);
            console.log(7);
            if (typeNode) return next(typeNode);
        }
    }
});
