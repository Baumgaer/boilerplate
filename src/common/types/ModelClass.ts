import type { EntityOptions, IndexOptions } from "typeorm";
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
     * Defines multi row indexes. The order defines the importance
     *
     * @memberof IExtraOptions
     */
    indexes?: [IMultiRowIndex, ...IMultiRowIndex[]];
}

export type ModelOptions<T extends typeof BaseModel> = Pick<EntityOptions, AllowedModelFields> & IExtraOptions & ThisType<T>;
