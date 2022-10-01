import { createRule } from "../lib/RuleContext";

export const Model = createRule({
    name: "Model",
    type: "Model",
    detect() {
        return true;
    }
});
