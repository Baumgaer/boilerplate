import { isNumberType, isLiteralType } from "../../utils/Type";
import { getTypeFromNode } from "../../utils/utils";
import { createRule } from "../lib/RuleContext";

export const AttrTypeNumber = createRule({
    name: "Attr-Type-Number",
    type: "Attr",
    detect(program, sourceFile, node) {
        const checker = program.getTypeChecker();
        const type = getTypeFromNode(checker, node);
        return isNumberType(type) && !isLiteralType(type);
    },
    emitType() {
        return {
            identifier: "Number",
            isPrimitive: true
        };
    }
});
