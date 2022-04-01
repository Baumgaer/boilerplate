import type { SetOptional } from "type-fest";
import type { EntityOptions, IndexOptions } from "typeorm";
import type { IModelMetadata } from "~common/@types/MetadataTypes";
import type BaseModel from "~common/lib/BaseModel";

export type AllowedModelFields = "engine" | "orderBy" | "withoutRowid" | "database" | "schema";

export interface IMultiRowIndex {

    /**
     * Defines the rows to build the index of. The order defines the importance
     *
     * @memberof IMultiRowIndex
     */
    columns: [string, ...string[]];

    /**
     * General options for the whole multi row index
     *
     * @memberof IMultiRowIndex
     */
    options?: IndexOptions;
}

export interface IExtraOptions {

    /**
     * Defines the name of the class during runtime (class name may minified)
     *
     * @memberof IExtraOptions
     */
    className?: string;

    /**
     * Defines the collection to store this model in. When a child model has
     * the same collectionName as its parent model, they are stored in the same
     * collection and discriminated with a type column.
     *
     * @memberof IExtraOptions
     */
    collectionName?: string;

    /**
     * Marks a model explicitly as an abstract class which enables single
     * table model inheritance.
     */
    isAbstract?: boolean;

    /**
     * Defines multi row indexes. The order defines the importance
     *
     * @memberof IExtraOptions
     */
    indexes?: [IMultiRowIndex, ...IMultiRowIndex[]];
}

export type ModelOptions<T extends typeof BaseModel> = Pick<EntityOptions, AllowedModelFields> & IExtraOptions & ThisType<T>;
export type ModelOptionsWithMetadataJson<T extends typeof BaseModel> = ModelOptions<T> & { metadataJson: string }
export type ModelOptionsPartialMetadataJson<T extends typeof BaseModel> = IModelMetadata & SetOptional<ModelOptionsWithMetadataJson<T>, "metadataJson">;
