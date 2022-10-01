import { isBooleanType, isLiteralType } from "../../utils/Type";
import { getTypeFromTypeNode } from "../../utils/utils";
import { createRule } from "../lib/RuleContext";

export const AttrTypeBoolean = createRule({
    name: "Attr-Type-Boolean",
    type: "Attr",
    detect(program, sourceFile, node) {
        const checker = program.getTypeChecker();
        const type = getTypeFromTypeNode(checker, node.type);
        return isBooleanType(type) && !isLiteralType(type);
    },
    emitType() {
        return {
            identifier: "Boolean",
            isPrimitive: true
        };
    }
});
