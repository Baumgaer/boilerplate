import * as path from "path";
import minimatch from "minimatch";
import { isTypeReferenceNode, isNewExpression, isIdentifierNode } from "../../utils/SyntaxKind";
import { isObjectType, isAnyType, isClassType, isInterfaceType } from "../../utils/Type";
import { getTypeFromPropertyDeclaration, resolveTypeReferenceTo } from "../../utils/utils";
import { createRule } from "../lib/RuleContext";
import type ts from "typescript";

export const AttrTypeModel = createRule({
    name: "Attr-Type-Model",
    type: "Attr",
    detect(program, sourceFile, node) {
        if (!isTypeReferenceNode(node.type)) return false;

        const checker = program.getTypeChecker();
        const type = getTypeFromPropertyDeclaration(checker, node);
        if (!isObjectType(type) && !isAnyType(type) && !isClassType(type) || isInterfaceType(type)) return false;

        let nodeToCheck: ts.Identifier | ts.TypeReferenceNode | ts.NewExpression | undefined;
        if (isTypeReferenceNode(node.type)) {
            nodeToCheck = node.type;
        } else if (isNewExpression(node.initializer) || isIdentifierNode(node.initializer)) nodeToCheck = node.initializer;
        if (!nodeToCheck) return false;

        const resolvedNode = resolveTypeReferenceTo(program, nodeToCheck, "ClassDeclaration");
        if (!resolvedNode) return false;

        const filePath = (resolvedNode.getSourceFile()?.fileName || "").replaceAll("\\", "/");
        if (!filePath) return false;

        const environments = [this.environment, "common", "env"];
        const aliases = program.getCompilerOptions().paths as Record<string, string[]>;

        return Object.keys(aliases).filter((alias) => {
            return environments.some((environment) => alias.startsWith(`~${environment}`));
        }).some((alias) => {
            return aliases[alias].some((pathPattern) => {
                pathPattern = path.join(path.dirname(this.tsConfigPath), pathPattern).replaceAll("\\", "/");
                pathPattern = pathPattern.replace(`/${this.environment}/`, `/${this.environment}/models/`);
                pathPattern = pathPattern.replace("/common/", `/common/models/`);
                const match = minimatch(filePath, pathPattern);
                return match;
            });
        });
    },
    emitType(program, sourceFile, node) {
        let nodeToCheck: ts.Identifier | ts.TypeReferenceNode | ts.NewExpression | undefined = node.type as ts.TypeReferenceNode;
        if (!nodeToCheck && isNewExpression(node.initializer) || isIdentifierNode(node.initializer)) nodeToCheck = node.initializer;
        const resolvedNode = resolveTypeReferenceTo(program, nodeToCheck, "ClassDeclaration") as ts.ClassDeclaration;

        return {
            identifier: resolvedNode.name?.getText(resolvedNode.getSourceFile()),
            isObjectType: true,
            isModel: true
        };
    }
});
