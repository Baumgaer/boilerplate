import * as fs from "fs";
import * as path from "path";
import { path as arPart } from "app-root-path";
import { merge } from "lodash";
import * as ts from "typescript";
import {
    isIdentifierNode,
    isDecoratorNode,
    isPropertyDeclaration,
    isPropertySignature,
    isClassDeclaration,
    isParameter
} from "../../utils/SyntaxKind";
import { programFromConfig } from "../../utils/utils";
import type { IConfiguration, ValidDeclarations } from "../@types/Transformer";
import type { createRule } from "./RuleContext";
import type { PluginConfig } from "ttypescript/lib/PluginCreator";

const checkers = {
    Attr: isPropertyDeclaration,
    Arg: isParameter,
    Model: isClassDeclaration
};

let program: ts.Program | null = null;

export default function transformer(config: PluginConfig & IConfiguration, rules: ReturnType<typeof createRule>[]) {
    if (!config.tsConfigPath) throw new Error("No ts config path given");
    config.tsConfigPath = path.resolve(arPart, config.tsConfigPath);
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

        function isValidDeclaration(node: ts.Node): node is ValidDeclarations {
            return Object.keys(checkers).some((checkerName) => {
                return checkers[checkerName as keyof typeof checkers](node) && ts.canHaveDecorators(node) && ts.getDecorators(node)?.some((decorator) => {
                    return decorator.expression.getText(decorator.getSourceFile()).includes(checkerName);
                });
            });
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
                let echoType = "type";
                if (isPropertyDeclaration(usedNode) || isPropertySignature(usedNode) || isParameter(usedNode)) {
                    if (isPropertyDeclaration(usedNode)) {
                        echoType = "attr";
                    } else if (isParameter(usedNode)) {
                        echoType = "arg";
                    } else echoType = "prop";
                    metadata = {};
                } else if (isClassDeclaration(usedNode)) echoType = "model";

                let name = "unknown";
                if (isPropertyDeclaration(usedNode) || isPropertySignature(usedNode) || isParameter(usedNode) || isClassDeclaration(usedNode)) {
                    name = usedNode.name?.getText() || "unknown";
                } else name = usedNode.getText(usedNode.getSourceFile());

                if (process.env.NODE_ENV !== "production") console.info(`${"".padStart(dept, "\t")}Processing ${echoType} ${name}`);

                const matchedRules = [];
                for (const rule of rules) {
                    const isValidDecorator = isIdentifierNode(node.expression) && (rule.type as string[]).includes(node.expression.escapedText.toString());
                    if (!isValidDecorator) continue;

                    rule.config = config;
                    const detectedNode = rule.detect(program, sourceFile, usedNode, matchedRules);
                    if (detectedNode) {
                        matchedRules.push(rule);
                        if (process.env.NODE_ENV !== "production") console.info(`${"".padStart(dept + 1, "\t")}${rule.name} matched`);

                        merge(metadata, rule.emitMetadata(usedNode, program, sourceFile, detectedNode) || {});
                        const type = rule.emitType(program, sourceFile, detectedNode, (node: ts.Node) => next(node, dept + 2, metadata));
                        if (echoType === "type") {
                            return type;
                        } else merge(metadata, { type });
                    }
                }
                return metadata;
            };

            const metadata = next(node.parent.parent as ValidDeclarations);
            if (!Object.keys(metadata).length) {
                if (process.env.NODE_ENV !== "production") console.info("skipped!");
                return node;
            }
            if (process.env.NODE_ENV !== "production") console.debug("Result:", JSON.stringify(metadata), "\n");
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
