import type { SetOptional } from "type-fest";
import type { DeepTypedOptions } from "~env/@types/DeepTypedSchema";
import type { IDeepTypedMetadata } from "~env/@types/MetadataTypes";
import type SchemaBased from "~env/lib/SchemaBased";

export interface ArgOptions<T extends typeof SchemaBased> extends DeepTypedOptions<T> {

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

export type ArgOptionsWithMetadataJson<T extends typeof SchemaBased> = ArgOptions<T> & { metadataJson: string }
export type ArgOptionsPartialMetadataJson<T extends typeof SchemaBased> = IDeepTypedMetadata & SetOptional<ArgOptionsWithMetadataJson<T>, "metadataJson">;
