import type { Constructor, ValueOf } from "type-fest";
import type { SchemaTypeOptions, Schema } from "mongoose";
import type BaseModel from "~common/lib/BaseModel";
import type AttributeSchema from "~common/lib/AttributeSchema";

export type CalculatedType<T extends Constructor<BaseModel>> = Pick<SchemaTypeOptions<T>, "ref" | "enum"> & {
    // eslint-disable-next-line
    type: ValueOf<typeof Schema.Types> | Schema<T> | ReturnType<AttributeSchema<T>["calculateTypePartials"]>[]
};
