import path from "path";
import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(name => `https://github.com/Eluminati/boilerplate/tree/main/dev/eslint-plugin-boilerplate/${name}`);

export const NoInvalidCommonImport = createRule({
    name: "no-invalid-common-import",
    meta: {
        type: "problem",
        docs: {
            description: "Checks if common imports are only existent in same named files",
            recommended: "error"
        },
        schema: [],
        messages: {
            noInvalidCommonImport: "common imports are only allowed for same named files"
        }
    },
    defaultOptions: [],
    create(context) {
        return {
            ImportDeclaration(node) {
                const [environment, ...parts] = node.source.value.split("/");
                if (environment.startsWith("~common") && !context.getFilename().includes(parts.join(path.sep) + ".ts") && !context.getFilename().includes(parts.join(path.sep) + ".d.ts")) {
                    context.report({ messageId: "noInvalidCommonImport", node: node });
                }
            }
        };
    }
});

