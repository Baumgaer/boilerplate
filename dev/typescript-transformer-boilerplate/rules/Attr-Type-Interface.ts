import { merge } from "lodash";
import { isTypeReferenceNode, isNewExpression, isIdentifierNode, isPropertyDeclaration } from "../../utils/SyntaxKind";
import { isObjectType, isAnyType, isInterfaceType } from "../../utils/Type";
import { getTypeFromNode, resolveTypeReferenceTo } from "../../utils/utils";
import { createRule } from "../lib/RuleContext";
import type ts from "typescript";

export const AttrTypeInterface = createRule({
    name: "Attr-Type-Interface",
    type: "Attr",
    detect(program, sourceFile, node) {
        let nodeToCheck: ts.Node | undefined = node;
        if (isPropertyDeclaration(node)) nodeToCheck = node.type;

        const checker = program.getTypeChecker();
        const type = getTypeFromNode(checker, node);
        if (!isObjectType(type) && !isAnyType(type) && !isInterfaceType(type)) return false;

        let nodeToResolve: ts.Identifier | ts.TypeReferenceNode | ts.NewExpression | undefined;
        if (isTypeReferenceNode(nodeToCheck)) {
            nodeToResolve = nodeToCheck;
        } else if (isPropertyDeclaration(nodeToCheck) && (isNewExpression(nodeToCheck.initializer) || isIdentifierNode(nodeToCheck.initializer))) {
            nodeToResolve = nodeToCheck.initializer;
        }
        if (!nodeToResolve) return false;

        const resolvedNode = resolveTypeReferenceTo(program, nodeToResolve, "InterfaceDeclaration");
        if (!resolvedNode) return false;

        const filePath = resolvedNode.getSourceFile()?.fileName;
        if (!filePath) return false;

        return true;
    },
    emitType(program, sourceFile, node, next) {
        let nodeToCheck: ts.Node | undefined = node;
        if (isPropertyDeclaration(node)) nodeToCheck = node.type;

        let nodeToResolve: ts.Identifier | ts.TypeReferenceNode | ts.NewExpression | undefined = nodeToCheck as ts.TypeReferenceNode;
        if (!nodeToResolve && isPropertyDeclaration(nodeToCheck) && (isNewExpression(nodeToCheck.initializer) || isIdentifierNode(nodeToCheck.initializer))) {
            nodeToResolve = nodeToCheck.initializer;
        }

        const resolvedNode = resolveTypeReferenceTo(program, nodeToResolve, "InterfaceDeclaration") as ts.InterfaceDeclaration;
        const members = resolvedNode.members.reduce((previous, member) => {
            const result = next(member);
            return merge(previous, { [result.name]: result });
        }, {});

        return {
            identifier: resolvedNode.name?.getText(resolvedNode.getSourceFile()),
            isObjectType: true,
            isInterface: true,
            members
        };
    }
});
