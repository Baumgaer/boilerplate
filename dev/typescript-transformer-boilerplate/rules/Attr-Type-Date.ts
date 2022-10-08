import { isDateTypeNode, isPropertyDeclaration, isPropertySignature } from "../../utils/SyntaxKind";
import { isObjectType } from "../../utils/Type";
import { getTypeFromNode } from "../../utils/utils";
import { createRule } from "../lib/RuleContext";
import type ts from "typescript";

export const AttrTypeDate = createRule({
    name: "Attr-Type-Date",
    type: "Attr",
    detect(program, sourceFile, node) {
        const checker = program.getTypeChecker();
        const type = getTypeFromNode(checker, node);

        let nodeToCheck: ts.Node | undefined = node;
        if (isPropertyDeclaration(node) || isPropertySignature(node)) nodeToCheck = node.type;
        if (isObjectType(type) && isDateTypeNode(checker, nodeToCheck)) return nodeToCheck;
        return false;
    },
    emitType() {
        return {
            identifier: "Date",
            isObjectType: true,
            isNamedObject: true
        };
    }
});
