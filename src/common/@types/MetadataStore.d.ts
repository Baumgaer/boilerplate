import type { InstanceTypes, SchemaTypeNames } from "~env/@types/Schema";

export type SchemasType<T extends ModelLike> = Record<SchemaTypeNames<T>, Record<string, any[]>>;
export type InstancesType<T extends ModelLike> = Record<SchemaTypeNames<T>, WeakMap<InstanceType<T> | T, Record<string, InstanceTypes<T>>>>;
