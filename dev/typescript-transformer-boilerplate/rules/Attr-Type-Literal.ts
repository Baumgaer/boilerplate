import { isLiteralType, isStringLiteralType, isNumberLiteralType, isBigIntLiteralType, isBooleanLiteralType } from "../../utils/Type";
import { getTypeFromTypeNode } from "../../utils/utils";
import { createRule } from "../lib/RuleContext";
import type ts from "typescript";

export const AttrTypeLiteral = createRule({
    name: "Attr-Type-Literal",
    type: "Attr",
    detect(program, sourceFile, node) {
        const checker = program.getTypeChecker();
        const type = getTypeFromTypeNode(checker, node.type);
        return isLiteralType(type);
    },
    emitType(program, sourceFile, node) {
        const checker = program.getTypeChecker();
        const type = getTypeFromTypeNode(checker, node.type);

        let identifier = "Any";
        if (isStringLiteralType(type)) {
            identifier = "String";
        } else if (isNumberLiteralType(type)) {
            identifier = "Number";
        } else if (isBooleanLiteralType(type)) {
            identifier = "Boolean";
        } else if (isBigIntLiteralType(type)) {
            identifier = "BigInt";
        }

        return {
            identifier,
            isPrimitive: true,
            isLiteral: true,
            value: (type as ts.LiteralType).value
        };
    }
});
