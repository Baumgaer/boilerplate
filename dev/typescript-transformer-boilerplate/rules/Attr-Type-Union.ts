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
        if (Boolean(isUnionOrIntersectionType(type) && isUnionType(type) && !isBooleanType(type) && !type.aliasSymbol) || isUnionTypeNode(nodeToCheck)) {
            return nodeToCheck as ts.UnionOrIntersectionTypeNode;
        }
        return false;
    },
    emitType(program, sourceFile, node, next) {
        const subTypes = node.types.map((typeNode) => next(typeNode));
        const isObjectType = subTypes.every((subType) => subType.isObjectType);
        return {
            isObjectType,
            isUnionOrIntersection: true,
            isUnion: true,
            subTypes
        };
    }
});
