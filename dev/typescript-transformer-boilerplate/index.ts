import transformer from "./lib/Transformer";
import { AttrTypeAny } from "./rules/Attr-Type-Any";
import { AttrTypeArray } from "./rules/Attr-Type-Array";
import { AttrTypeBoolean } from "./rules/Attr-Type-Boolean";
import { AttrTypeCustom } from "./rules/Attr-Type-Custom";
import { AttrTypeDate } from "./rules/Attr-Type-Date";
import { AttrTypeInterface } from "./rules/Attr-Type-Interface";
import { AttrTypeIntersection } from "./rules/Attr-Type-Intersection";
import { AttrTypeLiteral } from "./rules/Attr-Type-Literal";
import { AttrTypeModel } from "./rules/Attr-Type-Model";
import { AttrTypeNull } from "./rules/Attr-Type-Null";
import { AttrTypeNumber } from "./rules/Attr-Type-Number";
import { AttrTypeOptional } from "./rules/Attr-Type-Optional";
import { AttrTypeParenthesized } from "./rules/Attr-Type-Parenthesized";
import { AttrTypeString } from "./rules/Attr-Type-String";
import { AttrTypeTuple } from "./rules/Attr-Type-Tuple";
import { AttrTypeUndefined } from "./rules/Attr-Type-Undefined";
import { AttrTypeUnion } from "./rules/Attr-Type-Union";
import { Model } from "./rules/Model";
import type { IConfiguration } from "./@types/Transformer";
import type { PluginConfig } from "ttypescript/lib/PluginCreator";
import type ts from "typescript";

const rules = [
    AttrTypeParenthesized,
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
    AttrTypeUnion,
    AttrTypeIntersection,
    AttrTypeTuple,
    AttrTypeArray,
    AttrTypeOptional,
    AttrTypeCustom,
    AttrTypeAny
];

export default function (_prog: ts.Program, config: PluginConfig & IConfiguration) {
    return transformer(config, rules);
}
