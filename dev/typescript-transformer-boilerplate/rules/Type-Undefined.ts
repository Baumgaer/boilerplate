import { isUndefinedType } from "../../utils/Type";
import { getTypeFromNode } from "../../utils/utils";
import { createRule } from "../lib/RuleContext";

export const TypeUndefined = createRule({
    name: "Type-Undefined",
    type: ["Attr", "Arg"],
    detect(program, sourceFile, node) {
        const checker = program.getTypeChecker();
        if (isUndefinedType(getTypeFromNode(checker, node))) return node;
        return false;
    },
    emitType() {
        return {
            identifier: "Undefined",
            isPrimitive: true
        };
    }
});
