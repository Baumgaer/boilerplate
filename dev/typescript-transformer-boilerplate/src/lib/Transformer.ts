import * as fs from "fs";
import * as path from "path";
import isCi from "is-ci";
import { merge } from "lodash";
import * as ts from "typescript";
import { isIdentifierNode, isDecoratorNode } from "../utils/SyntaxKind";
import { getDecorators, hasDecorator, programFromConfig } from "../utils/utils";
import { emittingDecorators } from "./RuleContext";
import type { createRule } from "./RuleContext";
import type { IConfiguration, ValidDeclaration } from "../@types/Transformer";
import type { PluginConfig } from "ttypescript/lib/PluginCreator";

let program: ts.Program | null = null;

export default function transformer(config: PluginConfig & IConfiguration, rules: ReturnType<typeof createRule>[]) {
    if (!config.tsConfigPath) throw new Error("No ts config path given");
    config.tsConfigPath = path.resolve(config.tsConfigPath);
    if (!fs.existsSync(config.tsConfigPath)) throw new Error(`No such config file ${config.tsConfigPath}`);

    return (context: ts.TransformationContext) => {

        function getProgram(reCreate = false) {
            if (program && !reCreate) return program;
            program = programFromConfig(config.tsConfigPath);
            return program;
        }

        function getProgramAndSourceFile(filePath: string): [ts.Program, ts.SourceFile] {
            let theProgram = getProgram();
            let theSourceFile = theProgram.getSourceFile(filePath);
            if (!theSourceFile) {
                theProgram = getProgram(true);
                theSourceFile = theProgram.getSourceFile(filePath);
            }
            return [theProgram, theSourceFile as ts.SourceFile];
        }

        function isValidDeclaration(node: ts.Node): node is ValidDeclaration {
            return Object.keys(emittingDecorators).some((decoratorName) => {
                return emittingDecorators[decoratorName as keyof typeof emittingDecorators].some((checker: any) => {
                    return checker.attachedNodeCheck(node) && hasDecorator(node, decoratorName);
                });
            });
        }

        function getOutputParameters(usedNode: ts.Node) {
            for (const decoratorName in emittingDecorators) {
                if (Object.prototype.hasOwnProperty.call(emittingDecorators, decoratorName)) {
                    const checkers = emittingDecorators[decoratorName as keyof typeof emittingDecorators];
                    for (const checker of checkers) {
                        if (checker.attachedNodeCheck(usedNode) && (hasDecorator(usedNode, decoratorName) || !getDecorators(usedNode).length)) {
                            return { echoType: checker.echoType, resetsMetadata: checker.resetsMetadata, name: usedNode.name?.getText() || "unknown" };
                        }
                    }
                }
            }
            try {
                return { echoType: "type", resetsMetadata: false, name: usedNode.getText(usedNode.getSourceFile()) };
            } catch (error) {
                return { echoType: "type", resetsMetadata: false, name: "<Constructed>" };
            }
        }

        function buildMetadataJson(node: ts.CallExpression, metadata: Record<string, any>) {
            const metadataJson = JSON.stringify(metadata);
            const argument = <ts.ObjectLiteralExpression>node.arguments[0];
            let objectLiteralExpression = null;
            if (!argument) {
                objectLiteralExpression = ts.factory.createObjectLiteralExpression([ts.factory.createPropertyAssignment(
                    ts.factory.createIdentifier("metadataJson"),
                    ts.factory.createStringLiteral(metadataJson)
                )], false);
            } else {
                objectLiteralExpression = ts.factory.updateObjectLiteralExpression(
                    argument,
                    argument.properties.concat([ts.factory.createPropertyAssignment(
                        ts.factory.createIdentifier("metadataJson"),
                        ts.factory.createStringLiteral(metadataJson)
                    )])
                );
            }
            return ts.factory.updateCallExpression(node, node.expression, node.typeArguments, [objectLiteralExpression]);
        }

        function processCallExpression(program: ts.Program, sourceFile: ts.SourceFile, node: ts.CallExpression) {
            if (!isDecoratorNode(node.parent) || !isValidDeclaration(node.parent?.parent)) return node;

            const next = (usedNode: ts.Node, dept = 0, metadata: Record<string, any> = {}) => {
                const { echoType, resetsMetadata, name } = getOutputParameters(usedNode);
                if (resetsMetadata) metadata = {};

                if (process.env.NODE_ENV !== "production" && !isCi) console.info(`${"".padStart(dept, "\t")}Processing ${echoType} ${name}`);

                const matchedRules = [];
                for (const rule of rules) {
                    const isValidDecorator = isIdentifierNode(node.expression) && (rule.type as string[]).includes(node.expression.escapedText.toString());
                    if (!isValidDecorator) continue;

                    rule.config = config;
                    const detectedNode = rule.detect(program, sourceFile, usedNode, matchedRules);
                    if (detectedNode) {
                        matchedRules.push(rule);
                        if (process.env.NODE_ENV !== "production" && !isCi) console.info(`${"".padStart(dept + 1, "\t")}${rule.name} matched`);

                        merge(metadata, rule.emitMetadata(usedNode, program, sourceFile, detectedNode) || {});
                        let type = {};
                        type = rule.emitType(usedNode, program, sourceFile, detectedNode, (node: ts.Node) => next(node, dept + 2, metadata));
                        if (echoType === "type") {
                            return type;
                        } else {
                            rule.emitDeclarationFiles(usedNode, program, sourceFile, detectedNode);
                            merge(metadata, { type });
                        }
                    }
                }
                return metadata;
            };

            const metadata = next(node.parent.parent as ValidDeclaration);
            if (!Object.keys(metadata).length) {
                if (process.env.NODE_ENV !== "production" && !isCi) console.info("skipped!");
                return node;
            }
            if (process.env.NODE_ENV !== "production" && !isCi) console.debug("Result:", JSON.stringify(metadata), "\n");
            const result = buildMetadataJson(node, metadata);
            return result;
        }

        return (sourceFile: ts.SourceFile) => {
            const [theProgram, theSourceFile] = getProgramAndSourceFile(sourceFile.fileName);

            const visitor = (node: ts.Node): ts.Node => {
                if (ts.isCallExpression(node)) {
                    try {
                        return processCallExpression(theProgram, theSourceFile, node);
                    } catch (error) {
                        console.log(error);
                        process.exit(0);
                    }
                }
                return ts.visitEachChild(node, visitor, context);
            };
            return ts.visitNode(sourceFile, visitor);
        };
    };
}
