import path from "path";
import { getLeadingCommentRanges, canHaveModifiers, getModifiers } from "typescript";
import { createRule } from "../lib/RuleContext";
import { isPropertyDeclaration, isImportDeclaration, isNamedImportsNode, isIdentifierNode, isOverrideKeyword, isPublicKeyword } from "../utils/SyntaxKind";
import { hasDecorator } from "../utils/utils";
import type { ClassDeclaration, PropertyDeclaration, Identifier } from "typescript";

export const Model = createRule({
    name: "Model",
    type: ["Model"],
    detect(program, sourceFile, node) {
        return node as ClassDeclaration;
    },
    emitDeclarationFiles(program, sourceFile, node) {
        const checker = program.getTypeChecker();
        const parsedModelFilePath = path.parse(path.resolve(sourceFile.fileName));
        const fileName = `${parsedModelFilePath.name}.d.${parsedModelFilePath.ext.includes("tsx") ? "tsx" : "ts"}`;
        const parsedTsConfigFilePath = path.parse(path.resolve(this.tsConfigPath));
        const pathParts = parsedModelFilePath.dir.split(path.sep);
        const commonIndex = pathParts.findIndex(part => part === "common");
        const environmentIndex = pathParts.findIndex(part => part === this.environment);
        const isCommonModel = Boolean(commonIndex >= 0 && (environmentIndex === -1 || commonIndex < environmentIndex));

        function extractInterfaceText(node: PropertyDeclaration) {
            if (canHaveModifiers(node) && (getModifiers(node)?.some(isOverrideKeyword) || !getModifiers(node)?.some(isPublicKeyword))) return "";
            const leadingCommentRanges = getLeadingCommentRanges(sourceFile.getFullText(), node.getFullStart());

            let comment = "";
            if (leadingCommentRanges && leadingCommentRanges.length) {
                comment = "\n    " + leadingCommentRanges.map(leadingCommentRange => {
                    return sourceFile.getFullText().slice(leadingCommentRange.pos, leadingCommentRange.end);
                }).join("\n    ");
                comment += "\n";
            }
            let questionMark = "";
            if (node.questionToken || node.initializer) questionMark = "?";
            return `${comment}    ${node.name.getText()}${questionMark}: ${node.type?.getText()};`;
        }

        function createImports(propertiesText: string) {
            const imports = {} as Record<string, { names: string[], isNamedImport: boolean }>;
            sourceFile.statements.forEach(statement => {
                if (!isImportDeclaration(statement)) return;
                const names = statement.importClause?.name ?? statement.importClause?.namedBindings;
                const importPath = statement.moduleSpecifier.getText();

                const push = (identifier: Identifier, isNamedImport = false) => {
                    const text = identifier.getText();
                    if (!imports[importPath]) imports[importPath] = { names: [], isNamedImport };
                    const regex = new RegExp(`\\b${text}`);
                    if (Array.from(propertiesText.match(regex) ?? []).length) imports[importPath].names.push(text);
                };

                if (isIdentifierNode(names)) {
                    push(names);
                } else if (isNamedImportsNode(names)) names.elements?.forEach((element) => push(element.name, true));
            });

            let importString = "";
            for (const importPath of Object.keys(imports)) {
                if (!imports[importPath].names.length) continue;
                importString += "import type ";
                if (imports[importPath].isNamedImport) importString += " { ";
                importString += imports[importPath].names.join(", ");
                if (imports[importPath].isNamedImport) importString += " } ";
                importString += ` from ${importPath};\n`;
            }
            return importString;
        }

        function getHeritage() {
            const heritage = node.heritageClauses?.[0]?.types[0].expression;
            const heritageSymbol = heritage ? checker.getSymbolAtLocation(heritage) : null;

            let name, importString;
            if (heritageSymbol) {
                name = `${heritage?.getText()}Params`;
                const clause = heritageSymbol.declarations?.[0];
                let declaration = null;
                if (clause) declaration = clause.parent;
                if (declaration && isImportDeclaration(declaration)) {
                    const text = declaration.moduleSpecifier.getText().split("/");
                    const fileName = text.pop();
                    const environment = text.shift();
                    importString = [environment, "interfaces", ...text, fileName].join("/");
                }
            }

            return [name, importString];
        }

        const name = `${node.name?.getText()}Params`;
        const heritage = getHeritage();
        const properties = node.members.filter(isPropertyDeclaration).filter(node => hasDecorator(node, "Attr")).map(extractInterfaceText).filter(text => Boolean(text));

        let extendsString = "";
        let extendsImport = "";
        if (heritage && heritage[0] && heritage[1]) {
            extendsString = ` extends ${heritage[0]}`;
            extendsImport = `import type ${heritage[0]} from ${heritage[1]};\n\n`;
        }

        const HINT = `/*\n *   / \\     THIS FILE IS AUTO GENERATED!\n *  / | \\    DO NOT ADD CONTENT HERE!\n * /__.__\\   THIS WILL BE OVERWRITTEN DURING NEXT GENERATION!\n */\n`;
        const constParams = `${HINT}${createImports(properties.join(""))}${extendsImport}export default interface ${name}${extendsString} {\n${properties.join("\n")}\n}`;

        let pathCorrection = "";
        if (isCommonModel) pathCorrection = "/../common";

        let nextParts = "";
        if (isCommonModel) {
            nextParts = pathParts.slice(commonIndex + 1).join("/");
        } else nextParts = pathParts.splice(environmentIndex + 1).join("/");

        const basePath = `${parsedTsConfigFilePath.dir}${pathCorrection}/interfaces/${nextParts}/`;
        return { [path.resolve(basePath, fileName)]: constParams };
    }
});
