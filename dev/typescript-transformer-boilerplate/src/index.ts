import transformer from "./lib/Transformer";
import { Action } from "./rules/Action";
import { Model } from "./rules/Model";
import { TypeAny } from "./rules/Type-Any";
import { TypeArray } from "./rules/Type-Array";
import { TypeBoolean } from "./rules/Type-Boolean";
import { TypeCustom } from "./rules/Type-Custom";
import { TypeDate } from "./rules/Type-Date";
import { TypeInterface } from "./rules/Type-Interface";
import { TypeIntersection } from "./rules/Type-Intersection";
import { TypeLiteral } from "./rules/Type-Literal";
import { TypeModel } from "./rules/Type-Model";
import { TypeNull } from "./rules/Type-Null";
import { TypeNumber } from "./rules/Type-Number";
import { TypeOptional } from "./rules/Type-Optional";
import { TypeParenthesized } from "./rules/Type-Parenthesized";
import { TypePromise } from "./rules/Type-Promise";
import { TypeString } from "./rules/Type-String";
import { TypeThis } from "./rules/Type-This";
import { TypeTuple } from "./rules/Type-Tuple";
import { TypeUndefined } from "./rules/Type-Undefined";
import { TypeUnion } from "./rules/Type-Union";
import type { IConfiguration } from "./@types/Transformer";
import type { PluginConfig } from "ttypescript/lib/PluginCreator";
import type ts from "typescript";

const rules = [
    TypeParenthesized,
    TypePromise,
    Model,
    Action,
    TypeThis,
    TypeNull,
    TypeUndefined,
    TypeString,
    TypeNumber,
    TypeBoolean,
    TypeLiteral,
    TypeDate,
    TypeModel,
    TypeInterface,
    TypeUnion,
    TypeIntersection,
    TypeTuple,
    TypeArray,
    TypeOptional,
    TypeCustom,
    TypeAny
];

export default function (_prog: ts.Program, config: PluginConfig & IConfiguration) {
    return transformer(config, rules);
}
