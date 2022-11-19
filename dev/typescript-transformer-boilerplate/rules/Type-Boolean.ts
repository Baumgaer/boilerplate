import { isBooleanType, isLiteralType } from "../../utils/Type";
import { getTypeFromNode } from "../../utils/utils";
import { createRule } from "../lib/RuleContext";

export const TypeBoolean = createRule({
    name: "Type-Boolean",
    type: ["Attr", "Arg", "Query", "Mutation"],
    detect(program, sourceFile, node) {
        const checker = program.getTypeChecker();
        const type = getTypeFromNode(checker, node);
        if (isBooleanType(type) && !isLiteralType(type)) return node;
        return false;
    },
    emitType() {
        return {
            identifier: "Boolean",
            isPrimitive: true
        };
    }
});
