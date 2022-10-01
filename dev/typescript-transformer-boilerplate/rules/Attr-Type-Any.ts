import { createRule } from "../lib/RuleContext";

export const AttrTypeAny = createRule({
    name: "Attr-Type-Any",
    type: "Attr",
    detect() {
        return true;
    },
    emitType() {
        return {
            isMixed: true
        };
    }
});
