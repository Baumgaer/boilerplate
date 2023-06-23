import { TypeError, AttributeError, BaseError } from "~env/lib/Errors";
import { baseTypeFuncs, toInternalValidationReturnType, getModelNameToModelMap } from "~env/utils/schema";
import { isObject, isPlainObject, hasOwnProperty } from "~env/utils/utils";
import type { Constructor } from "type-fest";
import type { getAttributeForValidation } from "~env/@types/BaseModel";
import type { ValidationResult } from "~env/@types/Errors";
import type BaseModel from "~env/lib/BaseModel";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Varchar<_TMin extends number, TMax extends number>(params: { name?: string, max?: TMax } = {}) {
    const max = Math.min(params.max ?? 65535, 65535);
    const name = params.name ?? "";
    const schemaType = baseTypeFuncs.string().min(0).max(max);

    return {
        schemaType,
        validate: (value: unknown) => toInternalValidationReturnType(name, value, schemaType.safeParse(value)),
        guard: (value: unknown): value is Varchar<TMax> => schemaType.safeParse(value).success,
        cast: (value: unknown) => String(value).slice(0, max) as Varchar<TMax>
    };
}

export function NumberRange<TMin extends number, TMax extends number>(params: { name?: string, min?: TMin, max?: TMax } = {}) {
    const { min = -Infinity, max = Infinity, name = "" } = params;
    const schemaType = baseTypeFuncs.number().gte(min).lte(max);

    return {
        schemaType,
        validate: (value: unknown) => toInternalValidationReturnType(name, value, schemaType.safeParse(value)),
        guard: (value: unknown): value is NumberRange<TMin, TMax> => schemaType.safeParse(value).success,
        cast: (value: unknown) => {
            const number = Number(value);
            if (isNaN(number)) return min as unknown as NumberRange<TMin, TMax>;
            return Math.min(max, Math.max(min, number)) as NumberRange<TMin, TMax>;
        }
    };
}

export function TextRange<TMin extends number, TMax extends number>(params: { name?: string, min?: TMin, max?: TMax } = {}) {
    const { min = 0, max = Infinity, name = "" } = params;
    const schemaType = baseTypeFuncs.string().min(min).max(max);

    return {
        schemaType,
        validate: (value: unknown) => toInternalValidationReturnType(name, value, schemaType.safeParse(value)),
        guard: (value: unknown): value is TextRange<TMin, TMax> => schemaType.safeParse(value).success,
        cast: (value: unknown) => {
            const text = String(value);
            if (text.length < min) return text.padEnd(min) as TextRange<TMin, TMax>;
            if (text.length > max) return text.slice(0, max) as TextRange<TMin, TMax>;
            return text as TextRange<TMin, TMax>;
        }
    };
}

export function Email(params: { name?: string } = {}) {
    const name = params.name ?? "";
    const schemaType = baseTypeFuncs.string().email();

    return {
        schemaType,
        validate: (value: unknown) => toInternalValidationReturnType(name, value, schemaType.safeParse(value)),
        guard: (value: unknown): value is Email => schemaType.safeParse(value).success,
        cast: (value: unknown) => {
            const result = schemaType.safeParse(value);
            if (result.success) return value as Email;
            return AggregateError(toInternalValidationReturnType(name, value, result).errors);
        }
    };
}

export function UUID(params: { name?: string } = {}) {
    const name = params.name ?? "";
    const schemaType = baseTypeFuncs.string().uuid();

    return {
        schemaType,
        validate: (value: unknown) => toInternalValidationReturnType(name, value, schemaType.safeParse(value)),
        guard: (value: unknown): value is UUID => schemaType.safeParse(value).success,
        cast: (value: unknown) => {
            const result = schemaType.safeParse(value);
            if (result.success) return value as UUID;
            return AggregateError(toInternalValidationReturnType(name, value, result).errors);
        }
    };
}

export function Model(params: { name?: string, getAttribute?: getAttributeForValidation<typeof BaseModel> } = {}) {
    const { name = "", getAttribute } = params;
    const schemaType = baseTypeFuncs.never();

    const funcs = {
        get schemaType() {
            const ModelClass = getModelNameToModelMap(name);
            if (!ModelClass) return schemaType;
            return ModelClass.getSchema()?.getSchemaType() || schemaType;
        },
        validate: async (value: unknown): Promise<ValidationResult> => {
            if (!getAttribute) return { success: false, errors: [new TypeError("no attribute getter given", "unknown", [])] };
            if (!isObject(value)) {
                return { success: false, errors: [new TypeError("Value is not an object", "type", [])] };
            }
            if ("isBaseModel" in value) return (value as BaseModel).validate();
            const errors: BaseError[] = [];
            for (const key in value) {
                if (hasOwnProperty(value, key)) {
                    const attribute = getAttribute(key);
                    if (!attribute) {
                        errors.push(new AttributeError(key, "inexistent", [key], value[key]));
                    } else if ("isAttributeSchema" in attribute && attribute.isInternal) {
                        errors.push(new AttributeError(key, "forbidden", [key], value[key]));
                    } else if ("isBaseAttribute" in attribute && attribute.schema.isInternal) {
                        errors.push(new AttributeError(key, "forbidden", [key], value[key]));
                    } else {
                        const validationResult = await attribute.validate(value[key]);
                        if (!validationResult.success) errors.push(...validationResult.errors);
                    }
                }
            }
            if (errors.length) return { success: false, errors };
            return { success: true, errors: [] };
        },
        guard: <T extends BaseModel>(value: unknown): value is T => {
            const ModelClass = getModelNameToModelMap(name);
            if (!ModelClass || !isObject(value)) return false;
            return value instanceof ModelClass;
        },
        cast: async <T extends BaseModel>(value: unknown) => {
            const ModelClass = getModelNameToModelMap(name);
            if (!ModelClass) return new AggregateError([new BaseError("unknown model name")]);
            const result = await funcs.validate(value);
            if (result.success) {
                if (isPlainObject(value)) return new (ModelClass as unknown as Constructor<T>)(value);
                return value as T;
            }
            return new AggregateError(result.errors);
        }
    };
    return funcs;
}
