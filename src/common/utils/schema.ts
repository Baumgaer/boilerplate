import { z } from "zod";
import { TypeError } from "~env/lib/Errors";
import { getValue, isObject, isValue } from "~env/utils/utils";
import type { SafeParseReturnType } from "zod";
import type { ValidationResult, TypedKinds } from "~env/@types/Errors";
import type BaseModel from "~env/lib/BaseModel";

export {
    ZodType as Type,
    ZodAny as AnyType,
    ZodArray as ArrayType,
    ZodBigInt as BigIntType,
    ZodBoolean as BooleanType,
    ZodBranded as BrandedType,
    ZodDate as DateType,
    ZodDefault as DefaultType,
    ZodDiscriminatedUnion as DiscriminatedUnionType,
    ZodEffects as EffectsType,
    ZodEnum as EnumType,
    ZodIntersection as IntersectionType,
    ZodLazy as LazyType,
    ZodLiteral as LiteralType,
    ZodMap as MapType,
    ZodNaN as NaNType,
    ZodNativeEnum as NativeEnumType,
    ZodNever as NeverType,
    ZodNull as NullType,
    ZodNullable as NullableType,
    ZodNumber as NumberType,
    ZodObject as ObjectType,
    ZodOptional as OptionalType,
    ZodPromise as PromiseType,
    ZodRecord as RecordType,
    ZodSet as SetType,
    ZodString as StringType,
    ZodTuple as TupleType,
    ZodUndefined as UndefinedType,
    ZodUnion as UnionType,
    ZodUnknown as UnknownType,
    ZodVoid as VoidType,
    NEVER as NEVER
} from "zod";

export const baseTypeFuncs = {
    any: z.any.bind(z),
    array: z.array.bind(z),
    bigint: z.bigint.bind(z),
    boolean: z.boolean.bind(z),
    coerce: z.coerce,
    date: z.date.bind(z),
    discriminatedUnion: z.discriminatedUnion.bind(z),
    effect: z.effect.bind(z),
    enum: z.enum.bind(z),
    function: z.function.bind(z),
    instanceof: z.instanceof.bind(z),
    intersection: z.intersection.bind(z),
    lazy: z.lazy.bind(z),
    literal: z.literal.bind(z),
    map: z.map.bind(z),
    nan: z.nan.bind(z),
    nativeEnum: z.nativeEnum.bind(z),
    never: z.never.bind(z),
    null: z.null.bind(z),
    nullable: z.nullable.bind(z),
    number: z.number.bind(z),
    object: z.object.bind(z),
    oboolean: z.oboolean.bind(z),
    onumber: z.onumber.bind(z),
    optional: z.optional.bind(z),
    ostring: z.ostring.bind(z),
    preprocess: z.preprocess.bind(z),
    promise: z.promise.bind(z),
    record: z.record.bind(z),
    set: z.set.bind(z),
    strictObject: z.strictObject.bind(z),
    string: z.string.bind(z),
    transformer: z.transformer.bind(z),
    tuple: z.tuple.bind(z),
    undefined: z.undefined.bind(z),
    union: z.union.bind(z),
    unknown: z.unknown.bind(z),
    void: z.void.bind(z)
};

export function toInternalValidationReturnType(name: string, value: unknown, validationResult: SafeParseReturnType<any, any>, errorClass = TypeError): ValidationResult {
    if (validationResult.success) return { success: validationResult.success, errors: [] };

    const errors = [];
    for (const issue of validationResult.error.issues) {
        let kind: TypedKinds = "unknown";
        if (issue.message === "Required") {
            kind = "required";
        } else if (issue.code === "too_big") {
            kind = "rangeOverflow";
        } else if (issue.code === "too_small") {
            kind = "rangeUnderflow";
        } else if (issue.code === "unrecognized_keys") {
            kind = "inexistent";
        } else if (issue.code.startsWith("invalid") && !issue.code.endsWith("type")) {
            kind = "format";
        } else kind = "type";

        let val = value;
        if (isObject(value)) val = getValue(value, issue.path);
        errors.push(new errorClass(name, kind, issue.path, val));
    }

    if (errors.length) return { success: false, errors };
    return { success: true, errors: [] };
}

export function getModelNameToModelMap<T extends string | undefined = undefined, R = T extends string ? typeof BaseModel | null : Record<string, typeof BaseModel>>(name?: T): R {
    if (!global.MODEL_NAME_TO_MODEL_MAP || !global.COLLECTION_NAME_TO_MODEL_MAP) {
        global.MODEL_NAME_TO_MODEL_MAP = {};
        global.COLLECTION_NAME_TO_MODEL_MAP = {};
        const context = require.context("~env/models/", true, /.+\.ts/, "sync");
        context.keys().forEach((key) => {
            const ModelClass = context(key).default;

            global.MODEL_NAME_TO_MODEL_MAP[key.substring(2, key.length - 3)] = ModelClass;
            global.COLLECTION_NAME_TO_MODEL_MAP[ModelClass.collectionName] = ModelClass;
        });
    }
    if (isValue(name)) {
        if (name in global.MODEL_NAME_TO_MODEL_MAP) return global.MODEL_NAME_TO_MODEL_MAP[name] as R;
        return null as R;
    }
    return global.MODEL_NAME_TO_MODEL_MAP as R;
}

export function getCollectionNameToModelMap<T extends string | undefined = undefined, R = T extends string ? typeof BaseModel | null : Record<string, typeof BaseModel>>(name?: T): R {
    if (!global.COLLECTION_NAME_TO_MODEL_MAP) getModelNameToModelMap();
    if (isValue(name)) {
        if (name in global.COLLECTION_NAME_TO_MODEL_MAP) return global.COLLECTION_NAME_TO_MODEL_MAP[name] as R;
        return null as R;
    }
    return global.COLLECTION_NAME_TO_MODEL_MAP as R;
}
