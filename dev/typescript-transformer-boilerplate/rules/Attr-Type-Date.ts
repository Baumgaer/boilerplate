import { isDateTypeNode } from "../../utils/SyntaxKind";
import { isObjectType } from "../../utils/Type";
import { getTypeFromTypeNode } from "../../utils/utils";
import { createRule } from "../lib/RuleContext";

export const AttrTypeDate = createRule({
    name: "Attr-Type-Date",
    type: "Attr",
    detect(program, sourceFile, node) {
        const checker = program.getTypeChecker();
        const type = getTypeFromTypeNode(checker, node.type);
        return isObjectType(type) && isDateTypeNode(checker, node.type);
    },
    emitType() {
        return {
            identifier: "Date",
            isObjectType: true
        };
    }
});
