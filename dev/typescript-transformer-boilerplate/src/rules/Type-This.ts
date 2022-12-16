import { createRule } from "../lib/RuleContext";
import { isThisTypeNode } from "../utils/SyntaxKind";

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
