import type { SetOptional } from "type-fest";
import type { RelationOptions, Generated, ColumnOptions } from "typeorm";
import type { ColumnCommonOptions } from "typeorm/decorator/options/ColumnCommonOptions";
import type { ColumnEnumOptions } from "typeorm/decorator/options/ColumnEnumOptions";
import type { ColumnHstoreOptions } from "typeorm/decorator/options/ColumnHstoreOptions";
import type { ColumnNumericOptions } from "typeorm/decorator/options/ColumnNumericOptions";
import type { ColumnWithLengthOptions } from "typeorm/decorator/options/ColumnWithLengthOptions";
import type { ColumnWithWidthOptions } from "typeorm/decorator/options/ColumnWithWidthOptions";
import type { SpatialColumnOptions } from "typeorm/decorator/options/SpatialColumnOptions";
import type { IMetadata } from "~common/types/MetadataTypes";

export type allowedAttrFields = "cascade" | "createForeignKeyConstraints" | "deferrable" | "orphanedRowAction" | "persistence" | "primary";

export type AllColumnOptions = ColumnOptions & ColumnCommonOptions & RelationOptions & SpatialColumnOptions & ColumnWithLengthOptions & ColumnWithWidthOptions & ColumnNumericOptions & ColumnEnumOptions & ColumnHstoreOptions;
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
