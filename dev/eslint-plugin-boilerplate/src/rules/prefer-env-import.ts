import { existsSync } from "fs";
import path from "path";
import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(name => `https://github.com/Eluminati/boilerplate/tree/main/dev/eslint-plugin-boilerplate/${name}`);

export const PreferEnvImports = createRule({
    name: "no-invalid-common-import",
    meta: {
        type: "problem",
        docs: {
            description: "Checks if common imports are only existent in same named files",
            recommended: "error"
        },
        schema: [{
            type: "object",
            properties: {
                checkEnvironmentsBasePaths: {
                    type: "array",
                    required: true,
                    items: {
                        type: "object",
                        properties: {
                            name: {
                                type: "string",
                                required: true
                            },
                            path: {
                                type: "string",
                                required: true
                            }
                        }
                    }
                }
            }
        }],
        messages: {
            preferEnvImports: "found occurrences in {{ occurrences }}. You must prefer ~env import!"
        }
    },
    defaultOptions: [],
    create(context) {
        return {
            ImportDeclaration(node) {
                const [environment, ...parts] = node.source.value.split("/");
                const options = context.options[0] as any;
                const extensions = [".ts", ".d.ts"] as const;
                if (!environment.startsWith("~") || environment === "~env") return;

                const foundAlternatives: string[] = [];

                for (const environmentBasePath of options.checkEnvironmentsBasePaths) {
                    const checkPath = path.resolve(path.join(environmentBasePath.path, ...parts));
                    for (const extension of extensions) {
                        if (existsSync(checkPath + extension) && !foundAlternatives.includes(environmentBasePath.name)) {
                            foundAlternatives.push(environmentBasePath.name);
                        }
                    }
                }
                if (foundAlternatives.length) {
                    context.report({ messageId: "preferEnvImports", node: node, data: { occurrences: foundAlternatives.join(", ") } });
                }
            }
        };
    }
});

