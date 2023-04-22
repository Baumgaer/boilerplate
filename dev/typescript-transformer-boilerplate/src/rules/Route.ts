import { createRule } from "../lib/RuleContext";
import { isAbstractKeyword } from "../utils/SyntaxKind";
import type ts from "typescript";

export const Route = createRule({
    name: "Route",
    type: ["Route"],
    detect(program, sourceFile, node) {
        return node as ts.ClassDeclaration;
    },
    emitMetadata(program, sourceFile, node) {
        const namespace = node.name?.getText().toLowerCase();
        const isAbstract = node.modifiers?.some((modifier) => isAbstractKeyword(modifier));
        return { namespace, isAbstract };
    }
});
