import transformer from "./lib/Transformer";
import { AttrTypeAny } from "./rules/Attr-Type-Any";
import { AttrTypeBoolean } from "./rules/Attr-Type-Boolean";
import { AttrTypeDate } from "./rules/Attr-Type-Date";
import { AttrTypeInterface } from "./rules/Attr-Type-Interface";
import { AttrTypeLiteral } from "./rules/Attr-Type-Literal";
import { AttrTypeModel } from "./rules/Attr-Type-Model";
import { AttrTypeNull } from "./rules/Attr-Type-Null";
import { AttrTypeNumber } from "./rules/Attr-Type-Number";
import { AttrTypeString } from "./rules/Attr-Type-String";
import { AttrTypeUndefined } from "./rules/Attr-Type-Undefined";
import { Model } from "./rules/Model";
import type { IConfiguration } from "./@types/Transformer";
import type { PluginConfig } from "ttypescript/lib/PluginCreator";
import type ts from "typescript";

const rules = [
    Model,
    AttrTypeNull,
    AttrTypeUndefined,
    AttrTypeString,
    AttrTypeNumber,
    AttrTypeBoolean,
    AttrTypeLiteral,
    AttrTypeDate,
    AttrTypeModel,
    AttrTypeInterface,
    AttrTypeAny
];

export default function (_prog: ts.Program, config: PluginConfig & IConfiguration) {
    return transformer(config, rules);
}
