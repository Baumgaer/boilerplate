import { isNumberType, isLiteralType } from "../../utils/Type";
import { getTypeFromTypeNode } from "../../utils/utils";
import { createRule } from "../lib/RuleContext";

export const AttrTypeNumber = createRule({
    name: "Attr-Type-Number",
    type: "Attr",
    detect(program, sourceFile, node) {
        const checker = program.getTypeChecker();
        const type = getTypeFromTypeNode(checker, node.type);
        return isNumberType(type) && !isLiteralType(type);
    },
    emitType() {
        return {
            identifier: "Number",
            isPrimitive: true
        };
    }
});
