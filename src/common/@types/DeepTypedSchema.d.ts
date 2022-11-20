import type { SetOptional } from "type-fest";
import type { ZodTypeAny, ZodLazy, ZodObject, ZodNever, ZodRawShape } from "zod";
import type { IDeepTypedMetadata } from "~env/@types/MetadataTypes";
import type { ModelLike } from "~env/@types/ModelClass";
import type * as DataTypes from "~env/lib/DataTypes";

export interface IInjectedOptions {
    /**
     * The minimum of a number or of the length of a string
     */
    min?: number;

    /**
     * The maximum of a number or of the length of a string
     */
    max?: number;

    /**
     * A number or the length of a string have to be multiple of this value
     */
    multipleOf?: number;

    /**
     * The name of the datatype which holds the schema and corresponding validation function
     */
    validator?: keyof typeof DataTypes;
}

export interface DeepTypedOptions<T extends ModelLike> extends IInjectedOptions, Partial<Omit<IDeepTypedMetadata, "type", "name">> {

    /**
     * An alternative name to the attribute. Useful in case of renaming the
     * attribute but keeping the name in the database.
     */
    name?: string | keyof T;

    /**
     * Defines an attribute as primary column in the database
     */
    primary?: boolean;
}

export type DeepTypedOptionsWithMetadataJson<T extends ModelLike> = DeepTypedOptions<T> & { metadataJson: string }
export type DeepTypedOptionsPartialMetadataJson<T extends ModelLike> = IDeepTypedMetadata & SetOptional<DeepTypedOptionsWithMetadataJson<T>, "metadataJson">;
export type ObjectSchemaType = ZodLazy<ZodObject<ZodRawShape>> | ZodObject<ZodRawShape> | ZodNever
export type SchemaTypes = ZodTypeAny;
