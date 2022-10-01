import { isStringType, isLiteralType } from "../../utils/Type";
import { getTypeFromNode } from "../../utils/utils";
import { createRule } from "../lib/RuleContext";

export const AttrTypeString = createRule({
    name: "Attr-Type-String",
    type: "Attr",
    detect(program, sourceFile, node) {
        const checker = program.getTypeChecker();
        const type = getTypeFromNode(checker, node);
        return isStringType(type) && !isLiteralType(type);
    },
    emitType() {
        return {
            identifier: "String",
            isPrimitive: true
        };
    }
});
