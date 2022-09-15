import type { IAttributeChange } from "~env/@types/AttributeSchema";

export type ModelChanges<T> = Record<keyof T, IAttributeChange[]>;

export type RawObject<T> = Partial<ConstructionParams<T>>;

export type AttributeSchemaName<T> = keyof ConstructionParams<InstanceType<T>>
