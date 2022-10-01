import { isUndefinedType } from "../../utils/Type";
import { getTypeFromTypeNode } from "../../utils/utils";
import { createRule } from "../lib/RuleContext";

export const AttrTypeUndefined = createRule({
    name: "Attr-Type-Undefined",
    type: "Attr",
    detect(program, sourceFile, node) {
        const checker = program.getTypeChecker();
        return isUndefinedType(getTypeFromTypeNode(checker, node.type));
    },
    emitType() {
        return {
            identifier: "Undefined",
            isPrimitive: true
        };
    }
});
