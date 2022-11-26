import type { SetOptional } from "type-fest";
import type { DeepTypedOptions } from "~env/@types/DeepTypedSchema";
import type { IDeepTypedMetadata } from "~env/@types/MetadataTypes";
import type { ModelLike } from "~env/@types/ModelClass";

export interface ArgOptions<T extends ModelLike> extends DeepTypedOptions<T> {

    /**
     * @InheritDoc
     */
    name?: string;

    /**
     * The position of the argument within the method header.
     * This will be injected automatically by the transformer.
     */
    index?: number;
}

export type ArgOptionsWithMetadataJson<T extends ModelLike> = ArgOptions<T> & { metadataJson: string }
export type ArgOptionsPartialMetadataJson<T extends ModelLike> = IDeepTypedMetadata & SetOptional<ArgOptionsWithMetadataJson<T>, "metadataJson">;
