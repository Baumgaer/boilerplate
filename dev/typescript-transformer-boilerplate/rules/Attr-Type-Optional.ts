import { isPropertyDeclaration, isPropertySignature, isOptionalTypeNode } from "../../utils/SyntaxKind";
import { createRule } from "../lib/RuleContext";
import type ts from "typescript";

export const AttrTypeOptional = createRule({
    name: "Attr-Type-Optional",
    type: "Attr",
    detect(program, sourceFile, node) {
        let nodeToCheck: ts.Node | undefined = node;
        if (isPropertyDeclaration(node) || isPropertySignature(node)) nodeToCheck = node.type;
        if (!nodeToCheck) return false;
        return isOptionalTypeNode(nodeToCheck);
    },
    emitType(program, sourceFile, node, next) {
        let nodeToCheck = node as ts.OptionalTypeNode;
        if (isPropertyDeclaration(node) || isPropertySignature(node)) nodeToCheck = node.type as ts.OptionalTypeNode;

        const subType = next(nodeToCheck.type);
        return {
            isOptional: true,
            subType
        };
    }
});
