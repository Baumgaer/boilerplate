import { isNullType } from "../../utils/Type";
import { getTypeFromTypeNode } from "../../utils/utils";
import { createRule } from "../lib/RuleContext";

export const AttrTypeNull = createRule({
    name: "Attr-Type-Null",
    type: "Attr",
    detect(program, sourceFile, node) {
        const checker = program.getTypeChecker();
        return isNullType(getTypeFromTypeNode(checker, node.type));
    },
    emitType() {
        return {
            identifier: "Null",
            isPrimitive: true
        };
    }
});
