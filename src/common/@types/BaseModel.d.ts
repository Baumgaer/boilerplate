import type { IAttributeChange } from "~env/@types/AttributeSchema";
import type AttributeSchema from "~env/lib/AttributeSchema";
import type BaseAttribute from "~env/lib/BaseAttribute";
import type BaseModel from "~env/lib/BaseModel";

export type ModelChanges<T> = Record<keyof T, IAttributeChange[]>;

export type RawObject<T> = Partial<ConstructionParams<T>>;

export type AttributeSchemaName<T> = keyof ConstructionParams<InstanceType<T>>

export type getAttributeForValidation = (name: AttributeSchemaName<T>) => BaseAttribute<typeof BaseModel> | AttributeSchema<typeof BaseModel> | undefined
