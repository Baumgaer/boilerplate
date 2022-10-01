import { isNullType } from "../../utils/Type";
import { getTypeFromNode } from "../../utils/utils";
import { createRule } from "../lib/RuleContext";

export const AttrTypeNull = createRule({
    name: "Attr-Type-Null",
    type: "Attr",
    detect(program, sourceFile, node) {
        const checker = program.getTypeChecker();
        return isNullType(getTypeFromNode(checker, node));
    },
    emitType() {
        return {
            identifier: "Null",
            isPrimitive: true
        };
    }
});
