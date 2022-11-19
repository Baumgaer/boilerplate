import { merge } from "lodash";
import { isTypeReferenceNode, isNewExpression, isIdentifierNode, isPropertyDeclaration, isParameter } from "../../utils/SyntaxKind";
import { isObjectType, isAnyType, isInterfaceType } from "../../utils/Type";
import { getTypeFromNode, resolveTypeReferenceTo } from "../../utils/utils";
import { createRule } from "../lib/RuleContext";
import type ts from "typescript";

export const TypeInterface = createRule({
    name: "Type-Interface",
    type: ["Attr", "Arg", "Query", "Mutation"],
    detect(program, sourceFile, node) {
        let nodeToCheck: ts.Node | undefined = node;
        if (isPropertyDeclaration(node) || isParameter(node)) nodeToCheck = node.type;

        const checker = program.getTypeChecker();
        const type = getTypeFromNode(checker, node);
        if (!isObjectType(type) && !isAnyType(type) && !isInterfaceType(type)) return false;

        let nodeToResolve: ts.Identifier | ts.TypeReferenceNode | ts.NewExpression | undefined;
        if (isTypeReferenceNode(nodeToCheck)) {
            nodeToResolve = nodeToCheck;
        } else if ((isPropertyDeclaration(nodeToCheck) || isParameter(nodeToCheck)) && (isNewExpression(nodeToCheck.initializer) || isIdentifierNode(nodeToCheck.initializer))) {
            nodeToResolve = nodeToCheck.initializer;
        }
        if (!nodeToResolve) return false;

        const resolvedNode = resolveTypeReferenceTo(program, nodeToResolve, "InterfaceDeclaration");
        if (!resolvedNode) return false;

        const filePath = resolvedNode.getSourceFile()?.fileName;
        if (!filePath) return false;

        return resolvedNode as ts.InterfaceDeclaration;
    },
    emitType(program, sourceFile, node, next) {
        const members = node.members.reduce((previous, member) => {
            const result = next(member);
            return merge(previous, { [result.name]: result });
        }, {});

        return {
            identifier: node.name?.getText(node.getSourceFile()),
            isObjectType: true,
            isInterface: true,
            members
        };
    }
});
