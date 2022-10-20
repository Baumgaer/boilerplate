import { baseTypeFuncs, toInternalValidationReturnType } from "~common/utils/schema";
import AttributeSchema from "~env/lib/AttributeSchema";
import BaseAttribute from "~env/lib/BaseAttribute";
import { TypeError, AttributeError } from "~env/lib/Errors";
import { isObject, hasOwnProperty } from "~env/utils/utils";
import type { getAttributeForValidation } from "~env/@types/BaseModel";
import type { ValidationResult } from "~env/@types/Errors";
import type { ModelLike } from "~env/@types/ModelClass";
import type BaseModel from "~env/lib/BaseModel";
import type { BaseError } from "~env/lib/Errors";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Varchar<_TMin extends number, TMax extends number>(params: { max?: TMax } = {}) {
    const max = Math.min(params.max ?? 65535, 65535);
    const schemaType = baseTypeFuncs.string().min(0).max(max);

    return {
        schemaType,
        validate: (value: unknown) => toInternalValidationReturnType(schemaType.safeParse(value)),
        guard: (value: unknown): value is Varchar<TMax> => schemaType.safeParse(value).success,
        cast: (value: unknown) => String(value).slice(0, max) as Varchar<TMax>
    };
}

export function NumberRange<TMin extends number, TMax extends number>(params: { min?: TMin, max?: TMax } = {}) {
    const { min = -Infinity, max = Infinity } = params;
    const schemaType = baseTypeFuncs.number().gte(min).lte(max);

    return {
        schemaType,
        validate: (value: unknown) => toInternalValidationReturnType(schemaType.safeParse(value)),
        guard: (value: unknown): value is NumberRange<TMin, TMax> => schemaType.safeParse(value).success,
        cast: (value: unknown) => {
            const number = Number(value);
            if (isNaN(number)) return min as unknown as NumberRange<TMin, TMax>;
            return Math.min(max, Math.max(min, number)) as NumberRange<TMin, TMax>;
        }
    };
}

export function TextRange<TMin extends number, TMax extends number>(params: { min?: TMin, max?: TMax } = {}) {
    const { min = 0, max = Infinity } = params;
    const schemaType = baseTypeFuncs.string().min(min).max(max);

    return {
        schemaType,
        validate: (value: unknown) => toInternalValidationReturnType(schemaType.safeParse(value)),
        guard: (value: unknown): value is TextRange<TMin, TMax> => schemaType.safeParse(value).success,
        cast: (value: unknown) => {
            const text = String(value);
            if (text.length < min) return text.padEnd(min) as TextRange<TMin, TMax>;
            if (text.length > max) return text.slice(0, max) as TextRange<TMin, TMax>;
            return text as TextRange<TMin, TMax>;
        }
    };
}

export function Email() {
    const schemaType = baseTypeFuncs.string().email();

    return {
        schemaType,
        validate: (value: unknown) => toInternalValidationReturnType(schemaType.safeParse(value)),
        guard: (value: unknown): value is Email => schemaType.safeParse(value).success,
        cast: (value: unknown) => {
            const result = schemaType.safeParse(value);
            if (result.success) return value as Email;
            return AggregateError(toInternalValidationReturnType(result).errors);
        }
    };
}

export function UUID() {
    const schemaType = baseTypeFuncs.string().uuid();

    return {
        schemaType,
        validate: (value: unknown) => toInternalValidationReturnType(schemaType.safeParse(value)),
        guard: (value: unknown): value is UUID => schemaType.safeParse(value).success,
        cast: (value: unknown) => {
            const result = schemaType.safeParse(value);
            if (result.success) return value as UUID;
            return AggregateError(toInternalValidationReturnType(result).errors);
        }
    };
}

export function Model(params: { name?: string, getAttribute?: getAttributeForValidation<ModelLike> } = {}) {
    const { name, getAttribute } = params;
    const schemaType = baseTypeFuncs.string().uuid();

    return {
        schemaType,
        validate: (value: unknown): ValidationResult => {
            if (!getAttribute) return { success: false, errors: [new TypeError("no attribute getter given", "unknown", [])] };
            if (!isObject(value)) {
                return { success: false, errors: [new TypeError("Value is not an object", "type", [])] };
            }
            const errors: BaseError[] = [];
            for (const key in value) {
                if (hasOwnProperty(value, key)) {
                    const attribute = getAttribute(key);
                    if (!attribute) {
                        errors.push(new AttributeError(key, "inexistent", [key], value[key]));
                    } else if (attribute instanceof AttributeSchema && attribute.isInternal) {
                        errors.push(new AttributeError(key, "forbidden", [key], value[key]));
                    } else if (attribute instanceof BaseAttribute && attribute.schema.isInternal) {
                        errors.push(new AttributeError(key, "forbidden", [key], value[key]));
                    } else {
                        const validationResult = attribute.validate(value[key]);
                        if (!validationResult.success) errors.push(...validationResult.errors);
                    }
                }
            }
            if (errors.length) return { success: false, errors };
            return { success: true, errors: [] };
        },
        guard: <T extends BaseModel>(value: unknown): value is T => {
            if (!name || !(name in global.MODEL_NAME_TO_MODEL_MAP) || !isObject(value)) return false;
            return value instanceof global.MODEL_NAME_TO_MODEL_MAP[name];
        },
        cast: (value: unknown) => {
            const result = schemaType.safeParse(value);
            if (result.success) return value as BaseModel;
            return new AggregateError(toInternalValidationReturnType(result).errors);
        }
    };
}
