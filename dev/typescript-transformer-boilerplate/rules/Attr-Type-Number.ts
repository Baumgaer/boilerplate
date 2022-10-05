import { isNumberType, isLiteralType } from "../../utils/Type";
import { getTypeFromNode } from "../../utils/utils";
import { createRule } from "../lib/RuleContext";

export const AttrTypeNumber = createRule({
    name: "Attr-Type-Number",
    type: "Attr",
    detect(program, sourceFile, node) {
        const checker = program.getTypeChecker();
        const type = getTypeFromNode(checker, node);
        if (isNumberType(type) && !isLiteralType(type)) return node;
        return false;
    },
    emitType() {
        return {
            identifier: "Number",
            isPrimitive: true
        };
    }
});
