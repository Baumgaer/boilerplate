import { z } from "zod";

export const baseTypeFuncs = {
    any: z.any.bind(z),
    array: z.array.bind(z),
    bigint: z.bigint.bind(z),
    boolean: z.boolean.bind(z),
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
