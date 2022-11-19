import { isDateTypeNode, isPropertyDeclaration, isPropertySignature, isParameter } from "../../utils/SyntaxKind";
import { isObjectType } from "../../utils/Type";
import { getTypeFromNode } from "../../utils/utils";
import { createRule } from "../lib/RuleContext";
import type ts from "typescript";

export const TypeDate = createRule({
    name: "Type-Date",
    type: ["Attr", "Arg", "Query", "Mutation"],
    detect(program, sourceFile, node) {
        const checker = program.getTypeChecker();
        const type = getTypeFromNode(checker, node);

        let nodeToCheck: ts.Node | undefined = node;
        if (isPropertyDeclaration(node) || isPropertySignature(node) || isParameter(node)) nodeToCheck = node.type;
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
