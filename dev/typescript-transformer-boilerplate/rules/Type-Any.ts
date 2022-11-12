import { createRule } from "../lib/RuleContext";

export const TypeAny = createRule({
    name: "Type-Any",
    type: ["Attr", "Arg"],
    detect(program, sourceFile, node, matchedRules) {
        if (matchedRules.length) return false;
        return node;
    },
    emitType() {
        return {
            isMixed: true
        };
    }
});
