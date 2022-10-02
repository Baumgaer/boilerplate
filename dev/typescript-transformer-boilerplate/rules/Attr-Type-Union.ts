import {
    isPropertyDeclaration,
    isPropertySignature,
    isUnionTypeNode,
    isTypeNode,
    isOptionalTypeNode
} from "../../utils/SyntaxKind";
import { isUnionOrIntersectionType, isUnionType, isBooleanType } from "../../utils/Type";
import { getTypeFromNode } from "../../utils/utils";
import { createRule } from "../lib/RuleContext";
import type ts from "typescript";

export const AttrTypeUnion = createRule({
    name: "Attr-Type-Union",
    type: "Attr",
    detect(program, sourceFile, node) {
        const checker = program.getTypeChecker();

        let nodeToCheck: ts.Node | undefined = node;
        if (isPropertyDeclaration(node) || isPropertySignature(node)) nodeToCheck = node.type;
        if (!nodeToCheck || isTypeNode(nodeToCheck) && isOptionalTypeNode(nodeToCheck)) return false;

        const type = getTypeFromNode(checker, nodeToCheck);
        return Boolean(isUnionOrIntersectionType(type) && isUnionType(type) && !isBooleanType(type) && !type.aliasSymbol) || isUnionTypeNode(nodeToCheck);
    },
    emitType(program, sourceFile, node, next) {
        let nodeToCheck: ts.Node | undefined = node;
        if (isPropertyDeclaration(node) || isPropertySignature(node)) nodeToCheck = node.type;

        const subTypes = (nodeToCheck as ts.UnionOrIntersectionTypeNode).types.map((typeNode) => next(typeNode));
        return {
            isObjectType: true,
            isUnionOrIntersection: true,
            isUnion: true,
            subTypes
        };
    }
});
