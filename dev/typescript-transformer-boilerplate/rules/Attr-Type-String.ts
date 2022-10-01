import { isStringType, isLiteralType } from "../../utils/Type";
import { getTypeFromTypeNode } from "../../utils/utils";
import { createRule } from "../lib/RuleContext";

export const AttrTypeString = createRule({
    name: "Attr-Type-String",
    type: "Attr",
    detect(program, sourceFile, node) {
        const checker = program.getTypeChecker();
        const type = getTypeFromTypeNode(checker, node.type);
        return isStringType(type) && !isLiteralType(type);
    },
    emitType() {
        return {
            identifier: "String",
            isPrimitive: true
        };
    }
});
