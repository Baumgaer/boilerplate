import * as fs from "fs";
import * as path from "path";
import { path as arPart } from "app-root-path";
import { merge } from "lodash";
import * as ts from "typescript";
import { isIdentifierNode, isDecoratorNode, isPropertyDeclaration, isClassDeclaration } from "../../utils/SyntaxKind";
import { programFromConfig } from "../../utils/utils";
import type { IConfiguration, ValidDeclarations } from "../@types/Transformer";
import type { createRule } from "./RuleContext";
import type { PluginConfig } from "ttypescript/lib/PluginCreator";

const checkers = {
    Attr: isPropertyDeclaration,
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
            return Object.values(checkers).some((checker) => checker(node));
        }

        function isDetected(program: ts.Program, sourceFile: ts.SourceFile, rule: ReturnType<typeof createRule>, node: ts.CallExpression) {
            const usedNode = node.parent.parent as ValidDeclarations;
            const isValidDecorator = isIdentifierNode(node.expression) && node.expression.escapedText === rule.type;
            return isValidDecorator && rule.detect(program, sourceFile, usedNode);
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

            const next = (usedNode: ts.Node, fallbackType = "Attr") => {
                let nodeType = "";
                if (isPropertyDeclaration(usedNode)) nodeType = "Attr";
                if (isClassDeclaration(usedNode)) nodeType = "Model";

                if (nodeType) {
                    console.info(`processing ${nodeType} ${(usedNode as ValidDeclarations).name?.getText() || "unknown"}`);
                } else nodeType = fallbackType;

                const metadata: Record<string, any> = {};
                for (const rule of rules) {
                    rule.config = config;
                    if (isDetected(program, sourceFile, rule, node)) {
                        console.info(`${rule.name} matched!`);
                        merge(metadata, rule.emitMetadata(program, sourceFile, usedNode) || {});
                        merge(metadata, { type: rule.emitType(program, sourceFile, usedNode, next) });
                    }
                }
                console.log(JSON.stringify(metadata));
                return metadata;
            };
            const metadata = next(node.parent.parent as ValidDeclarations);
            if (!Object.keys(metadata).length) return node;
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
