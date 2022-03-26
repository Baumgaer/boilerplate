import type { SetOptional } from "type-fest";
import type { RelationOptions, Generated, ColumnOptions, IndexOptions } from "typeorm";
import type { ColumnCommonOptions } from "typeorm/decorator/options/ColumnCommonOptions";
import type { ColumnEnumOptions } from "typeorm/decorator/options/ColumnEnumOptions";
import type { ColumnHstoreOptions } from "typeorm/decorator/options/ColumnHstoreOptions";
import type { ColumnNumericOptions } from "typeorm/decorator/options/ColumnNumericOptions";
import type { ColumnWithLengthOptions } from "typeorm/decorator/options/ColumnWithLengthOptions";
import type { ColumnWithWidthOptions } from "typeorm/decorator/options/ColumnWithWidthOptions";
import type { SpatialColumnOptions } from "typeorm/decorator/options/SpatialColumnOptions";
import type BaseModel from "~common/lib/BaseModel";
import type { IAttrMetadata } from "~common/types/MetadataTypes";

export type allowedAttrFields = "cascade" | "createForeignKeyConstraints" | "deferrable" | "orphanedRowAction" | "persistence";

export type AllColumnOptions = ColumnOptions & ColumnCommonOptions & RelationOptions & SpatialColumnOptions & ColumnWithLengthOptions & ColumnWithWidthOptions & ColumnNumericOptions & ColumnEnumOptions & ColumnHstoreOptions;
/**
 * The well known relations of relational databases.
 */
export interface IRelations {
    /**
     * The column of the target type where the relation is connected to
     */
    relationColumn?: string;

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

export interface AttrOptions<T extends typeof BaseModel> extends Pick<RelationOptions, allowedAttrFields>, IRelations, ISpecialColumns, ThisType<T> {

    /**
     * Defines the attribute as an index column which can be used additionally
     * with multi row index on model
     */
    index?: true | IndexOptions;

    /**
     * Defines an attribute as primary column in the database
     */
    primary?: boolean;
}

export interface IAttributeChange {
    type: AttrObserverTypes;
    path: (string | symbol)[];
    index?: number;
    value: unknown
}

//export type AttrOptions<T extends typeof BaseModel> = Pick<RelationOptions, allowedAttrFields> & IRelations & ISpecialColumns & ThisType<T>
export type AttrOptionsWithMetadataJson<T extends typeof BaseModel> = AttrOptions<T> & { metadataJson: string }
export type AttrOptionsPartialMetadataJson<T extends typeof BaseModel> = IAttrMetadata & SetOptional<AttrOptionsWithMetadataJson<T>, "metadataJson">;
export type AttrObserverTypes = "add" | "remove" | "change"
