import type { SetOptional } from "type-fest";
import type { DeepTypedOptions } from "~env/@types/DeepTypedSchema";
import type { IDeepTypedMetadata } from "~env/@types/MetadataTypes";
import type { HttpMethods } from "~env/@types/http";
import type SchemaBased from "~env/lib/SchemaBased";

export type AccessRightFunc = (user?: any, object?: any) => boolean;

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

export type ActionOptionsWithMetadataJson<T extends typeof SchemaBased> = ActionOptions<T> & { metadataJson: string };
export type ActionOptionsPartialMetadataJson<T extends typeof SchemaBased> = IDeepTypedMetadata & SetOptional<ActionOptionsWithMetadataJson<T>, "metadataJson">;

export interface IExecutedAction {
    id?: UUID;
    dummyId?: UUID;
    collection: string;
    name: string;
    args: Record<string, any>;
}
