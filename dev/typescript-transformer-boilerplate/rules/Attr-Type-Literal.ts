import { isLiteralType, isStringLiteralType, isNumberLiteralType, isBigIntLiteralType, isBooleanLiteralType } from "../../utils/Type";
import { getTypeFromNode } from "../../utils/utils";
import { createRule } from "../lib/RuleContext";
import type ts from "typescript";

export const AttrTypeLiteral = createRule({
    name: "Attr-Type-Literal",
    type: "Attr",
    detect(program, sourceFile, node) {
        const checker = program.getTypeChecker();
        const type = getTypeFromNode(checker, node);
        return isLiteralType(type);
    },
    emitType(program, sourceFile, node) {
        const checker = program.getTypeChecker();
        const type = getTypeFromNode(checker, node);

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

        let value: string | number | ts.PseudoBigInt | boolean = (type as ts.LiteralType).value;
        if (isBooleanLiteralType(type)) value = checker.typeToString(type as ts.Type) === "true" ? true : false;

        return {
            identifier,
            isPrimitive: true,
            isLiteral: true,
            value
        };
    }
});