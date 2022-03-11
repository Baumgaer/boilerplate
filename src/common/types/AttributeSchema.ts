import type { RelationOptions, Generated } from "typeorm";
import type { IMetadata } from "~common/types/MetadataTypes";
import type { SetOptional } from "type-fest";

export type allowedAttrFields = "cascade" | "createForeignKeyConstraints" | "deferrable" | "orphanedRowAction" | "persistence" | "primary";

/**
 * The well known relations of relational databases.
 */
export interface IRelations {
    /**
     * One current model A can only have one model B
     */
    oneToOne?: boolean;

    /**
     * One current model A can habe multiple models B
     */
    oneToMany?: string;

    /**
     * Many current models A can have exactly one model B
     */
    manyToOne?: string;

    /**
     * Many current models A can have many model B
     */
    manyToMany?: boolean | string;

    /**
     * Defines the current model as owner of the relation
     */
    isRelationOwner?: boolean;
}

export interface ISpecialColumns {

    /**
     * This will automatically adjust the date when the model is created
     */
    isCreationDate?: boolean;

    /**
     * This will automatically adjust the date when the model is modified
     */
    isModifiedDate?: boolean;

    /**
     * This will automatically adjust the date when the model is deleted
     */
    isDeletedDate?: boolean;

    /**
     * When the model is modified, this column will be incremented
     */
    isVersion?: boolean;

    /**
     * Will automatically generate the given type when the model is created
     */
    isGenerated?: Parameters<typeof Generated>["0"]
}

export type AttrOptions<T> = Pick<RelationOptions, allowedAttrFields> & IRelations & ISpecialColumns & ThisType<T>
export type AttrOptionsWithMetadataJson<T> = AttrOptions<T> & { metadataJson: string }
export type AttrOptionsPartialMetadataJson<T> = IMetadata & SetOptional<AttrOptionsWithMetadataJson<T>, "metadataJson">;
export type AttrObserverTypes = "add" | "remove" | "change"
