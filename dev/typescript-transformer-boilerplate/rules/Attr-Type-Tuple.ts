import { isPropertyDeclaration, isPropertySignature, isTupleTypeNode } from "../../utils/SyntaxKind";
import { createRule } from "../lib/RuleContext";
import type ts from "typescript";

export const AttrTypeTuple = createRule({
    name: "Attr-Type-Tuple",
    type: "Attr",
    detect(program, sourceFile, node) {
        let nodeToCheck: ts.Node | undefined = node;
        if (isPropertyDeclaration(node) || isPropertySignature(node)) nodeToCheck = node.type;
        if (!nodeToCheck) return false;
        if (isTupleTypeNode(nodeToCheck)) return nodeToCheck;
        return false;
    },
    emitType(program, sourceFile, node, next) {
        const subTypes = node.elements.map((element) => next(element));
        return {
            isObjectType: true,
            isArray: true,
            isTuple: true,
            subTypes
        };
    }
});
