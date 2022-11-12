import { isNullType } from "../../utils/Type";
import { getTypeFromNode } from "../../utils/utils";
import { createRule } from "../lib/RuleContext";

export const TypeNull = createRule({
    name: "Type-Null",
    type: ["Attr", "Arg"],
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
