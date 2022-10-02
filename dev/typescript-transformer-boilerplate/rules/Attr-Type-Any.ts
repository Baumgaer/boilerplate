import { createRule } from "../lib/RuleContext";

export const AttrTypeAny = createRule({
    name: "Attr-Type-Any",
    type: "Attr",
    detect(program, sourceFile, node, matchedRules) {
        return !matchedRules.length;
    },
    emitType() {
        return {
            isMixed: true
        };
    }
});
