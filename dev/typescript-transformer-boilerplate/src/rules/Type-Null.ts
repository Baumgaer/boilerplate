import { createRule } from "../lib/RuleContext";
import { isNullType } from "../utils/Type";
import { getTypeFromNode } from "../utils/utils";

export const TypeNull = createRule({
    name: "Type-Null",
    type: ["Attr", "Arg", "Query", "Mutation"],
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
