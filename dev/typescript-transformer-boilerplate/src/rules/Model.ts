import { createRule } from "../lib/RuleContext";

export const Model = createRule({
    name: "Model",
    type: ["Model"],
    detect(program, sourceFile, node) {
        return node;
    }
});
