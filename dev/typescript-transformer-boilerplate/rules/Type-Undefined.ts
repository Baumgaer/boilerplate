import { isVoidKeyword } from "../../utils/SyntaxKind";
import { isUndefinedType } from "../../utils/Type";
import { getTypeFromNode } from "../../utils/utils";
import { createRule } from "../lib/RuleContext";

export const TypeUndefined = createRule({
    name: "Type-Undefined",
    type: ["Attr", "Arg", "Query", "Mutation"],
    detect(program, sourceFile, node) {
        const checker = program.getTypeChecker();
        if (isUndefinedType(getTypeFromNode(checker, node)) || isVoidKeyword(node)) return node;
        return false;
    },
    emitType() {
        return {
            identifier: "Undefined",
            isPrimitive: true
        };
    }
});
