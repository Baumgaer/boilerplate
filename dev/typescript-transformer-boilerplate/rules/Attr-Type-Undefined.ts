import { isUndefinedType } from "../../utils/Type";
import { getTypeFromNode } from "../../utils/utils";
import { createRule } from "../lib/RuleContext";

export const AttrTypeUndefined = createRule({
    name: "Attr-Type-Undefined",
    type: "Attr",
    detect(program, sourceFile, node) {
        const checker = program.getTypeChecker();
        return isUndefinedType(getTypeFromNode(checker, node));
    },
    emitType() {
        return {
            identifier: "Undefined",
            isPrimitive: true
        };
    }
});