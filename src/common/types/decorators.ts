import type { SchemaTypeOptions } from "mongoose";
import type { IMetadata } from "~common/types/MetadataTypes";
import type { SetOptional, SetRequired } from "type-fest";

export type allowedAttrFields = "alias" | "cast" | "select" | "index" | "unique" |
    "sparse" | "text" | "subtype" | "min" | "max" | "expires" | "excludeIndexes" |
    "match" | "lowercase" | "uppercase" | "trim" | "minlength" | "maxlength";

export type AttrOptions<T> = Partial<IMetadata> & Pick<SchemaTypeOptions<keyof T>, allowedAttrFields> & ThisType<T>

export type AttrOptionsWithMetadataJson<T> = AttrOptions<T> & { metadataJson: string }

export type AttrOptionsPartialMetadataJson<T> = SetRequired<AttrOptions<T>, "type"> & SetOptional<AttrOptionsWithMetadataJson<T>, "metadataJson">;
