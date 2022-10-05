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
        if (isOptionalTypeNode(nodeToCheck)) return nodeToCheck;
        return false;
    },
    emitType(program, sourceFile, node, next) {
        const subType = next(node.type);
        return {
            isOptional: true,
            subType
        };
    }
});
