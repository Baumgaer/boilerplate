import type { SetOptional, SetRequired } from "type-fest";
import type { RelationOptions } from "typeorm";
import type { IMetadata } from "~common/types/MetadataTypes";

export type allowedAttrFields = "cascade" | "createForeignKeyConstraints" | "deferrable" | "orphanedRowAction" | "persistence" | "primary";
export type AttrOptions<T> = Partial<IMetadata> & Pick<RelationOptions, allowedAttrFields> & ThisType<T>
export type AttrOptionsWithMetadataJson<T> = AttrOptions<T> & { metadataJson: string }
export type AttrOptionsPartialMetadataJson<T> = SetRequired<AttrOptions<T>, "type"> & SetOptional<AttrOptionsWithMetadataJson<T>, "metadataJson">;
export type AttrObserverTypes = "add" | "remove" | "change"
