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
        return isTupleTypeNode(nodeToCheck);
    },
    emitType(program, sourceFile, node, next) {
        let nodeToCheck: ts.TupleTypeNode = node as ts.TupleTypeNode;
        if (isPropertyDeclaration(node) || isPropertySignature(node)) nodeToCheck = node.type as ts.TupleTypeNode;

        const subTypes = nodeToCheck.elements.map((element) => next(element));
        return {
            isObjectType: true,
            isArray: true,
            isTuple: true,
            subTypes
        };
    }
});
