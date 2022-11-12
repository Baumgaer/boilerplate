import { getJSDocTags } from "typescript";
import {
    isPropertyDeclaration,
    isPropertySignature,
    isParameter,
    isTypeNode,
    isTypeReferenceNode,
    isLiteralTypeNode
} from "../../utils/SyntaxKind";
import { isInEnvironmentalPath } from "../../utils/utils";
import { createRule } from "../lib/RuleContext";
import type ts from "typescript";

const NOT_FOUND = "$$__NotFound__$$" as const;

function getDeclaration(program: ts.Program, nodeToCheck: ts.TypeReferenceNode) {
    const checker = program.getTypeChecker();
    const type = checker.getTypeFromTypeNode(nodeToCheck);
    return type.aliasSymbol?.getDeclarations()?.[0];
}

function getTagValueFromDeclaration(declaration: ts.TypeAliasDeclaration, tag: string) {
    const docTags = getJSDocTags(declaration);
    return docTags.find((docTag) => docTag.tagName.getText(docTag.getSourceFile()) === tag)?.comment?.toString();
}

function typeParameterToTypeArgumentValue(declaration: ts.TypeAliasDeclaration, typeNode: ts.TypeReferenceNode, typeParameterName: string, parse = true) {
    const index = declaration.typeParameters?.findIndex((typeParameter) => typeParameter.name.getText() === typeParameterName);
    if (typeof index === "number" && index >= 0) {
        const argument = typeNode.typeArguments?.at(index);
        if (parse) {
            if (!isLiteralTypeNode(argument)) return NOT_FOUND;
            try {
                return JSON.parse(argument.getText(argument.getSourceFile()));
            } catch (error) {
                return NOT_FOUND;
            }
        }
        return argument;
    }
    return NOT_FOUND;
}

export const TypeCustom = createRule({
    name: "Type-Custom",
    type: ["Attr", "Arg"],
    detect(program, sourceFile, node) {
        let nodeToCheck: ts.Node | undefined = node;
        if (isPropertyDeclaration(node) || isPropertySignature(node) || isParameter(node)) nodeToCheck = node.type;
        if (!nodeToCheck || !isTypeNode(nodeToCheck) || !isTypeReferenceNode(nodeToCheck)) return false;

        const declarationSourceFile = getDeclaration(program, nodeToCheck)?.getSourceFile();
        if (!declarationSourceFile) return false;
        if (isInEnvironmentalPath(program, this.tsConfigPath, "common", "@types/Datatypes.d.ts", declarationSourceFile.fileName)) {
            return nodeToCheck;
        }
        return false;
    },
    emitMetadata(program, sourceFile, node) {
        const declaration = getDeclaration(program, node) as ts.TypeAliasDeclaration;
        const docTags = getJSDocTags(declaration);
        const PropertyTags = docTags.filter((docTag) => docTag.tagName.getText(docTag.getSourceFile()) === "property");

        return Object.fromEntries(PropertyTags.map((tag) => {
            return tag.comment?.toString().matchAll(/\{(.*?)\}\s+(.+?)[\s\n]+?/gi) as IterableIterator<RegExpMatchArray>;
        }).filter((match) => Boolean(match)).map((match) => {
            const matchArray = Array.from(match)[0];
            const name = matchArray[2];
            let value: any;
            try {
                value = JSON.parse(matchArray[1]);
            } catch (error) {
                value = typeParameterToTypeArgumentValue(declaration, node, matchArray[1]);
                if (value === NOT_FOUND) return [];
            }
            return [name, value];
        }).filter((entry) => Boolean(entry.length)));
    },
    emitType(program, sourceFile, node, next) {
        const declaration = getDeclaration(program, node) as ts.TypeAliasDeclaration;
        const emits = getTagValueFromDeclaration(declaration, "emits");
        if (emits) {
            const typeParameterName = emits.split(" ")[0];
            const argumentType = typeParameterToTypeArgumentValue(declaration, node, typeParameterName, false);
            if (argumentType !== NOT_FOUND) return next(argumentType);
            throw new Error(`Could not resolve argumentType`);
        }

        const alias = getTagValueFromDeclaration(declaration, "alias");
        const identifier = alias || declaration.name.getText(declaration.getSourceFile());

        return {
            isCustomType: true,
            identifier
        };
    }
});
