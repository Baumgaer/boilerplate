import { createRule } from "../lib/RuleContext";
import { isTypeReferenceNode, isPropertyDeclaration, isParameter, isIdentifierNode, isPropertySignature } from "../utils/SyntaxKind";
import type ts from "typescript";

export const TypeRecord = createRule({
    name: "Type-Record",
    type: ["Attr", "Arg", "Query", "Mutation"],
    detect(program, sourceFile, node) {
        let nodeToCheck: ts.Node | undefined = node;
        if (isPropertyDeclaration(node) || isPropertySignature(node) || isParameter(node)) nodeToCheck = node.type || node.initializer;
        if (!nodeToCheck || !isTypeReferenceNode(nodeToCheck) || !("typeName" in nodeToCheck) || !isIdentifierNode(nodeToCheck.typeName) || nodeToCheck.typeName.escapedText !== "Record") return false;
        return nodeToCheck;
    },
    emitType(program, sourceFile, node, next) {
        const key = node.typeArguments?.[0];
        const value = node.typeArguments?.[1];

        return {
            isObjectType: true,
            isRecord: true,
            typeArguments: [
                key ? next(key) : { isMixed: true },
                value ? next(value) : { isMixed: true }
            ]
        };
    }
});
