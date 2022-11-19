import { isEqual } from "lodash";
import { isPropertyDeclaration, isPropertySignature, isParameter, isArrayTypeNode, isArrayLiteralExpression } from "../../utils/SyntaxKind";
import { createRule } from "../lib/RuleContext";
import type { MetadataType } from "../@types/MetadataTypes";
import type ts from "typescript";

export const TypeArray = createRule({
    name: "Type-Array",
    type: ["Attr", "Arg", "Query", "Mutation"],
    detect(program, sourceFile, node) {
        let nodeToCheck: ts.Node | undefined = node;
        if (isPropertyDeclaration(node) || isPropertySignature(node) || isParameter(node)) nodeToCheck = node.type || node.initializer;
        if (!nodeToCheck) return false;
        if (isArrayTypeNode(nodeToCheck) || isArrayLiteralExpression(nodeToCheck)) return nodeToCheck;
        return false;
    },
    emitType(program, sourceFile, node, next) {
        let subType: MetadataType = { isMixed: true };
        if (isArrayTypeNode(node)) {
            subType = next(node.elementType);
        } else if (isArrayLiteralExpression(node)) {
            if (node.elements.length) {
                const types = node.elements.map((element) => next(element));

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
