import { isStringType, isLiteralType } from "../../utils/Type";
import { getTypeFromNode } from "../../utils/utils";
import { createRule } from "../lib/RuleContext";

export const TypeString = createRule({
    name: "Type-String",
    type: ["Attr", "Arg", "Query", "Mutation"],
    detect(program, sourceFile, node) {
        const checker = program.getTypeChecker();
        const type = getTypeFromNode(checker, node);
        if (isStringType(type) && !isLiteralType(type)) return node;
        return false;
    },
    emitType() {
        return {
            identifier: "String",
            isPrimitive: true
        };
    }
});
