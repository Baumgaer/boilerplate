import type { SetOptional } from "type-fest";
import type { ArgOptions } from "~env/@types/ArgumentSchema";
import type { DeepTypedOptions } from "~env/@types/DeepTypedSchema";
import type { IDeepTypedMetadata } from "~env/@types/MetadataTypes";
import type { ModelLike } from "~env/@types/ModelClass";
import type BaseModel from "~env/lib/BaseModel";

export interface ActionOptions<T extends ModelLike> extends DeepTypedOptions<T> {

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

export interface ActionDefinition<T extends ModelLike> {
    descriptor: PropertyDescriptor;
    params: ActionOptions<T>;
    args: ArgOptions<T>[];
}

export type ActionOptionsWithMetadataJson<T extends ModelLike> = ActionOptions<T> & { metadataJson: string }
export type ActionOptionsPartialMetadataJson<T extends ModelLike> = IDeepTypedMetadata & SetOptional<ActionOptionsWithMetadataJson<T>, "metadataJson">;
