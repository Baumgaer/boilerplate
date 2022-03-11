import type { EntityOptions } from "typeorm";

export type allowedModelFields = "engine" | "orderBy" | "withoutRowid" | "database" | "schema";
export type ModelOptions<T> = Pick<EntityOptions, allowedModelFields> & { className?: string; collectionName?: string } & ThisType<T>;
