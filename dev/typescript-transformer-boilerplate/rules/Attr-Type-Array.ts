import { isEqual } from "lodash";
import { isPropertyDeclaration, isPropertySignature, isArrayTypeNode, isArrayLiteralExpression } from "../../utils/SyntaxKind";
import { createRule } from "../lib/RuleContext";
import type { MetadataType } from "../@types/MetadataTypes";
import type ts from "typescript";

export const AttrTypeArray = createRule({
    name: "Attr-Type-Array",
    type: "Attr",
    detect(program, sourceFile, node) {
        let nodeToCheck: ts.Node | undefined = node;
        if (isPropertyDeclaration(node) || isPropertySignature(node)) nodeToCheck = node.type || node.initializer;
        if (!nodeToCheck) return false;
        return isArrayTypeNode(nodeToCheck) || isArrayLiteralExpression(nodeToCheck);
    },
    emitType(program, sourceFile, node, next) {
        let nodeToCheck: ts.Node | undefined = node;
        if (isPropertyDeclaration(node) || isPropertySignature(node)) nodeToCheck = node.type || node.initializer;

        let subType: MetadataType = { isMixed: true };
        if (isArrayTypeNode(nodeToCheck)) {
            subType = next(nodeToCheck.elementType);
        } else if (isArrayLiteralExpression(nodeToCheck)) {
            if (nodeToCheck.elements.length) {
                const types = nodeToCheck.elements.map((element) => next(element));

                let toCompareWith = types[0];
                const allAreEqual = types.slice(1).every((type) => {
                    const result = isEqual(type, toCompareWith);
                    toCompareWith = type;
                    return result;
                });
                if (!allAreEqual) {
                    subType = {
                        isObjectType: true,
                        isUnionOrIntersection: true,
                        isUnion: true,
                        subTypes: types.map((type) => next(type))
                    };
                } else subType = types[0];
            } else subType = { isMixed: true };
        }
        return {
            isObjectType: true,
            isArray: true,
            subType
        };
    }
});
