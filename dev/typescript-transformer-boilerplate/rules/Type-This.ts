import { isThisTypeNode } from "../../utils/SyntaxKind";
import { createRule } from "../lib/RuleContext";

export const TypeThis = createRule({
    name: "Type-This",
    type: ["Attr", "Arg", "Query", "Mutation"],
    detect(program, sourceFile, node) {
        if (!isThisTypeNode(node)) return false;
        return node;
    },
    emitType() {
        return {
            isObjectType: true,
            isThisType: true
        };
    }
});
