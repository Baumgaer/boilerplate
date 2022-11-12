import { isPropertyDeclaration, isPropertySignature, isIntersectionTypeNode, isParameter } from "../../utils/SyntaxKind";
import { isUnionOrIntersectionType, isIntersectionType } from "../../utils/Type";
import { getTypeFromNode } from "../../utils/utils";
import { createRule } from "../lib/RuleContext";
import type ts from "typescript";

export const TypeIntersection = createRule({
    name: "Type-Intersection",
    type: ["Attr", "Arg"],
    detect(program, sourceFile, node) {
        const checker = program.getTypeChecker();

        let nodeToCheck: ts.Node | ts.TypeNode | undefined = node;
        if (isPropertyDeclaration(node) || isPropertySignature(node) || isParameter(node)) nodeToCheck = node.type;
        if (!nodeToCheck) return false;

        const type = getTypeFromNode(checker, nodeToCheck);
        if (Boolean(isUnionOrIntersectionType(type) && isIntersectionType(type) && !type.aliasSymbol) || isIntersectionTypeNode(nodeToCheck)) {
            return nodeToCheck;
        }
        return false;
    },
    emitType(program, sourceFile, node, next) {
        const subTypes = (node as ts.UnionOrIntersectionTypeNode).types.map((typeNode) => next(typeNode));
        return {
            isObjectType: true,
            isUnionOrIntersection: true,
            isIntersection: true,
            subTypes
        };
    }
});
