import { baseTypeFuncs } from "~common/utils/schema";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Varchar<_TMin extends number, TMax extends number>(params: { max?: TMax } = {}) {
    const max = Math.min(params.max ?? 65535, 65535);
    const schemaType = baseTypeFuncs.string().min(0).max(max);

    return {
        schemaType,
        validate: (value: unknown) => schemaType.safeParse(value),
        guard: (value: unknown): value is Varchar<TMax> => schemaType.safeParse(value).success,
        cast: (value: unknown) => String(value).slice(0, max) as Varchar<TMax>
    };
}

export function NumberRange<TMin extends number, TMax extends number>(params: { min?: TMin, max?: TMax } = {}) {
    const { min = -Infinity, max = Infinity } = params;
    const schemaType = baseTypeFuncs.number().gte(min).lte(max);

    return {
        schemaType,
        validate: (value: unknown) => schemaType.safeParse(value),
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
        validate: (value: unknown) => schemaType.safeParse(value),
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
        validate: (value: unknown) => schemaType.safeParse(value),
        guard: (value: unknown): value is Email => schemaType.safeParse(value).success,
        cast: (value: unknown) => {
            const result = schemaType.safeParse(value);
            if (result.success) return value as Email;
            return result.error;
        }
    };
}

export function UUID() {
    const schemaType = baseTypeFuncs.string().uuid();

    return {
        schemaType,
        validate: (value: unknown) => schemaType.safeParse(value),
        guard: (value: unknown): value is UUID => schemaType.safeParse(value).success,
        cast: (value: unknown) => {
            const result = schemaType.safeParse(value);
            if (result.success) return value as UUID;
            return result.error;
        }
    };
}
