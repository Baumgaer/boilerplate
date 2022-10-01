import { isBooleanType, isLiteralType } from "../../utils/Type";
import { getTypeFromNode } from "../../utils/utils";
import { createRule } from "../lib/RuleContext";

export const AttrTypeBoolean = createRule({
    name: "Attr-Type-Boolean",
    type: "Attr",
    detect(program, sourceFile, node) {
        const checker = program.getTypeChecker();
        const type = getTypeFromNode(checker, node);
        return isBooleanType(type) && !isLiteralType(type);
    },
    emitType() {
        return {
            identifier: "Boolean",
            isPrimitive: true
        };
    }
});
