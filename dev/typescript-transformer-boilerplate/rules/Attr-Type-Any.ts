import { createRule } from "../lib/RuleContext";

export const AttrTypeAny = createRule({
    name: "Attr-Type-Any",
    type: "Attr",
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
