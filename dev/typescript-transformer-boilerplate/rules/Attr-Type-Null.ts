import { isNullType } from "../../utils/Type";
import { getTypeFromNode } from "../../utils/utils";
import { createRule } from "../lib/RuleContext";

export const AttrTypeNull = createRule({
    name: "Attr-Type-Null",
    type: "Attr",
    detect(program, sourceFile, node) {
        const checker = program.getTypeChecker();
        if (isNullType(getTypeFromNode(checker, node))) return node;
        return false;
    },
    emitType() {
        return {
            identifier: "Null",
            isPrimitive: true
        };
    }
});
