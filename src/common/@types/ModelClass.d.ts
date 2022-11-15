import type { SetOptional } from "type-fest";
import type { EntityOptions, IndexOptions } from "typeorm";
// Need to be imported from common due to reference loop in common embedded entity
// eslint-disable-next-line boilerplate/prefer-env-import
import type { embeddedEntityFactory } from "~common/lib/EmbeddedEntity";
import type { IAttrMetadata, IModelMetadata } from "~env/@types/MetadataTypes";
import type BaseModel from "~env/lib/BaseModel";

export type ModelLike = typeof BaseModel | ReturnType<typeof embeddedEntityFactory>;
export type AllowedModelFields = "engine" | "orderBy" | "withoutRowid" | "database" | "schema";

export interface IMultiRowIndex {

    /**
     * Defines the rows to build the index of. The order defines the importance
     */
    columns: [string, ...string[]];

    /**
     * General options for the whole multi row index
     */
    options?: IndexOptions;
}

export interface IExtraOptions {

    /**
     * Defines the name of the class during runtime (class name may minified)
     */
    className?: string;

    /**
     * Defines the collection to store this model in. When a child model has
     * the same collectionName as its parent model, they are stored in the same
     * collection and discriminated with a type column.
     */
    collectionName?: string;

    /**
     * Marks a model explicitly as an abstract class which enables single
     * table model inheritance.
     */
    isAbstract?: boolean;

    /**
     * Defines multi row indexes. The order defines the importance
     */
    indexes?: [IMultiRowIndex, ...IMultiRowIndex[]];
}

export interface ActionParameters {
    /**
     * The name of the action which must correspond to the action on server / client.
     * If not given the name of the method will be used.
     */
    name?: string;

    /**
     * Determines wether the action is a local action or should be call the server.
     * Default: false
     */
    local?: boolean;

    /**
     * Determines the HTTP method of the action when not a local action.
     * Default: POST for mutation, GET for Query
     */
    httpMethod?: "GET" | "POST" | "PUT" | "PATCH" | "OPTIONS" | "DELETE"

    /**
     * A function which determines wether the user is allowed to execute this
     * action or not.
     * Default: () => false
     */
    accessRight?: (user: BaseModel, object: BaseModel) => boolean;
}

export interface ArgParameters {
    /**
     * The name of the parameter which must be correspond to the parameter on
     * server / client. If not given the name of the parameter itself will be used.
     */
    name?: string;

    /**
     * Determines wether the parameter represents an id.
     */
    isId?: boolean;
}

export interface ActionDefinition {
    descriptor: PropertyDescriptor;
    params: ActionParameters;
    args: ArgParameters;
}

export type ArgParametersWithMetadataJson = ArgParameters & { metadataJson: string }
export type ArgParametersPartialMetadataJson = IAttrMetadata & SetOptional<ArgParametersWithMetadataJson, "metadataJson">;
export type ModelOptions<T extends ModelLike> = Pick<EntityOptions, AllowedModelFields> & IExtraOptions & ThisType<T>;
export type ModelOptionsWithMetadataJson<T extends ModelLike> = ModelOptions<T> & { metadataJson: string }
export type ModelOptionsPartialMetadataJson<T extends ModelLike> = IModelMetadata & SetOptional<ModelOptionsWithMetadataJson<T>, "metadataJson">;
