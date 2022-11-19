import { isNumberType, isLiteralType } from "../../utils/Type";
import { getTypeFromNode } from "../../utils/utils";
import { createRule } from "../lib/RuleContext";

export const TypeNumber = createRule({
    name: "Type-Number",
    type: ["Attr", "Arg", "Query", "Mutation"],
    detect(program, sourceFile, node) {
        const checker = program.getTypeChecker();
        const type = getTypeFromNode(checker, node);
        if (isNumberType(type) && !isLiteralType(type)) return node;
        return false;
    },
    emitType() {
        return {
            identifier: "Number",
            isPrimitive: true
        };
    }
});
