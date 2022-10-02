import { isPropertyDeclaration, isPropertySignature, isIntersectionTypeNode } from "../../utils/SyntaxKind";
import { isUnionOrIntersectionType, isIntersectionType } from "../../utils/Type";
import { getTypeFromNode } from "../../utils/utils";
import { createRule } from "../lib/RuleContext";
import type ts from "typescript";

export const AttrTypeIntersection = createRule({
    name: "Attr-Type-Intersection",
    type: "Attr",
    detect(program, sourceFile, node) {
        const checker = program.getTypeChecker();

        let nodeToCheck: ts.Node | undefined = node;
        if (isPropertyDeclaration(node) || isPropertySignature(node)) nodeToCheck = node.type;
        if (!nodeToCheck) return false;

        const type = getTypeFromNode(checker, nodeToCheck);
        return Boolean(isUnionOrIntersectionType(type) && isIntersectionType(type) && !type.aliasSymbol) || isIntersectionTypeNode(nodeToCheck);
    },
    emitType(program, sourceFile, node, next) {
        let nodeToCheck: ts.Node | undefined = node;
        if (isPropertyDeclaration(node) || isPropertySignature(node)) nodeToCheck = node.type;

        const subTypes = (nodeToCheck as ts.UnionOrIntersectionTypeNode).types.map((typeNode) => next(typeNode));
        return {
            isObjectType: true,
            isUnionOrIntersection: true,
            isIntersection: true,
            subTypes
        };
    }
});
