import type { SetOptional } from "type-fest";
import type { RelationOptions, Generated, ColumnOptions, IndexOptions } from "typeorm";
import type { ColumnCommonOptions } from "typeorm/decorator/options/ColumnCommonOptions";
import type { ColumnEnumOptions } from "typeorm/decorator/options/ColumnEnumOptions";
import type { ColumnHstoreOptions } from "typeorm/decorator/options/ColumnHstoreOptions";
import type { ColumnNumericOptions } from "typeorm/decorator/options/ColumnNumericOptions";
import type { ColumnWithLengthOptions } from "typeorm/decorator/options/ColumnWithLengthOptions";
import type { ColumnWithWidthOptions } from "typeorm/decorator/options/ColumnWithWidthOptions";
import type { SpatialColumnOptions } from "typeorm/decorator/options/SpatialColumnOptions";
import type { DeepTypedOptions } from "~env/@types/DeepTypedSchema";
import type { IAttrMetadata } from "~env/@types/MetadataTypes";
import type { ModelLike } from "~env/@types/ModelClass";
import type BaseModel from "~env/lib/BaseModel";

export type { SchemaTypes, ObjectSchemaType } from "~env/@types/DeepTypedSchema";

/**
 * All attribute field names of typeorm which are allowed to use in column options
 */
export type allowedAttrFields = "createForeignKeyConstraints" | "deferrable" | "orphanedRowAction" | "persistence";

/**
 * All column options combined to one object
 */
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

export interface AttrOptions<T extends ModelLike> extends Pick<RelationOptions, allowedAttrFields>, IRelations, ISpecialColumns, IInjectedOptions, Partial<Omit<IAttrMetadata, "type", "name">>, DeepTypedOptions<T> {

    /**
     * Defines the attribute as an index column which can be used additionally
     * with multi row index on model
     */
    index?: true | IndexOptions;
}

export interface IAttributeChange {
    type: AttrObserverTypes | "init";
    path: (string | symbol)[];
    value: unknown,
    previousValue: unknown
}

export interface IEmbeddedEntity {
    static className: string;
}

export interface RelationDefinition {
    type: "OneToOne" | "OneToMany" | "ManyToOne" | "ManyToMany";
    mirrorClass: typeof BaseModel;
    mirrorAttributeName?: string
}

export type SchemaNameByModelClass<T> = keyof ConstructionParams<InstanceType<T>>;
export type AttrOptionsWithMetadataJson<T extends ModelLike> = AttrOptions<T> & { metadataJson: string };
export type AttrOptionsPartialMetadataJson<T extends ModelLike> = IAttrMetadata & SetOptional<AttrOptionsWithMetadataJson<T>, "metadataJson">;
export type AttrObserverTypes = "add" | "remove" | "change";

export type ChangeMethodsArgs<V> = [(string | symbol)[], V, V];
