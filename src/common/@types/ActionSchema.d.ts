import type { SetOptional } from "type-fest";
import type { ArgOptions } from "~env/@types/ArgumentSchema";
import type { DeepTypedOptions } from "~env/@types/DeepTypedSchema";
import type { IDeepTypedMetadata } from "~env/@types/MetadataTypes";
import type SchemaBased from "~env/lib/SchemaBased";

export type AccessRightFunc = (user?: any, object?: any) => boolean;
export type HttpMethods = "GET" | "POST" | "PUT" | "PATCH" | "OPTIONS" | "DELETE";

export interface ActionOptions<T extends typeof SchemaBased> extends DeepTypedOptions<T> {

    /**
     * Determines wether the action is a local action or should be call the server.
     * Default: false
     */
    local?: boolean;

    /**
     * Determines the HTTP method of the action when not a local action.
     * Default: POST for mutation, GET for Query
     */
    httpMethod?: HttpMethods

    /**
     * A function which determines wether the user is allowed to execute this
     * action or not.
     * Default: () => false
     */
    accessRight?: AccessRightFunc
}

export interface ActionDefinition<T extends typeof SchemaBased> {
    descriptor: PropertyDescriptor;
    params: ActionOptions<T>;
    args: ArgOptions<T>[];
}

export type ActionOptionsWithMetadataJson<T extends typeof SchemaBased> = ActionOptions<T> & { metadataJson: string };
export type ActionOptionsPartialMetadataJson<T extends typeof SchemaBased> = IDeepTypedMetadata & SetOptional<ActionOptionsWithMetadataJson<T>, "metadataJson">;

export interface IExecutedAction {
    id?: string;
    name: string;
    args: Record<string, any>;
}
