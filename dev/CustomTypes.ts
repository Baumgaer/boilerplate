import { resolve, sep } from "path";
import arp from "app-root-path";
import * as ts from "typescript";

interface IProperty {
    name: string;
    value: any;
    description: string;
}

interface ICustomType {
    name: string;
    parameters: string[];
    properties: IProperty[];
    emitParameter: string
}

export const customTypes: Record<string, ICustomType> = {};

const regex = /\*\s+@(?<tag>[\w\d]+)\s+(?:\{\s*(?<value>[\s\S]+?)\s*\}\s+)?(?<name>[^\s\n]+?)(?:\n|\s(?<description>[^\n]+?)\n)/g;
const dataTypesFilePath = resolve(arp.path, "src", "common", "@types", "Datatypes.d.ts").replaceAll(sep, "/");
const prog = ts.createProgram([dataTypesFilePath], {});

prog.getSourceFiles().forEach((sf) => {
    if (sf.fileName !== dataTypesFilePath) return;
    ts.forEachChild(sf, (node) => {
        if (ts.isTypeAliasDeclaration(node)) {
            const typeName = node.name.getText(sf);
            const customType: ICustomType = { name: typeName, parameters: [], properties: [], emitParameter: "" };

            let match = regex.exec(node.getFullText(sf));
            do {
                const group = match?.groups ?? {};
                if (group.tag === "property") {
                    let value: any;
                    try {
                        value = JSON.parse(group.value);
                    } catch (error) {
                        value = group.value;
                    }
                    customType.properties.push({ name: group.name, value, description: group.description });
                }
                if (group.tag === "emits") customType.emitParameter = group.name;
                if (group.tag === "alias") customType.name = group.name;
            } while ((match = regex.exec(node.getFullText(sf))) !== null);

            customType.parameters = node.typeParameters?.map((parameter) => parameter.name.getText(sf)) ?? [];
            customTypes[typeName] = customType;
        }
    });
});
