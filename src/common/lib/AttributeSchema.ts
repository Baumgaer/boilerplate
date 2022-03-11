import { merge } from 'lodash';
import { Column, PrimaryGeneratedColumn, OneToOne, OneToMany, ManyToOne, ManyToMany, JoinTable, JoinColumn, Generated, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, VersionColumn } from "typeorm";
import type BaseModel from "~common/lib/BaseModel";
import { pascalCase } from "~common/utils/utils";
import type { AttrOptions, AttrOptionsPartialMetadataJson } from "~common/types/AttributeSchema";
import type { IMetadata } from "~common/types/MetadataTypes";
import type { Constructor } from "type-fest";

const models: Record<string, Constructor<BaseModel>> = {};

interface IRelation<T extends Constructor<BaseModel>> {
    type: "one-to-one" | "one-to-many" | "many-to-one" | "many-to-many",
    field?: keyof InstanceType<T>;
}

export default class AttributeSchema<T extends Constructor<BaseModel>> implements AttrOptions<T> {

    /**
     * Holds the class object which created the schema
     *
     * @memberof AttributeSchema
     */
    public readonly ctor: T;

    /**
     * The name of the attribute in the schema. Corresponds to the attribute
     * name in the class (maybe not in runtime)
     *
     * @memberof AttributeSchema
     */
    public readonly attributeName: keyof InstanceType<T>;

    /**
     * The parameters which initializes the schema
     *
     * @memberof AttributeSchema
     */
    public readonly parameters = {} as Readonly<AttrOptionsPartialMetadataJson<T>>;

    /**
     * Indicates if an attribute should be sent to another endpoint.
     * Very important for privacy!
     *
     * @memberof AttributeSchema
     */
    public isInternal: boolean = false;

    /**
     * Indicates if an attribute has to be set manually (does not have a default)
     *
     * @memberof AttributeSchema
     */
    public isRequired: boolean = false;

    /**
     * Indicates if an attribute is readonly / not writable / only writable once
     *
     * @memberof AttributeSchema
     */
    public isImmutable: boolean = false;

    /**
     * Indicates if an attribute should only be loaded from database when it
     * is explicitly used. This is always the case when the type of the
     * attribute is a Promise
     *
     * @memberof AttributeSchema
     */
    public isLazy: boolean = false;

    /**
     * @inheritdoc
     *
     * @memberof AttributeSchema
     */
    public isCreationDate: boolean = false;

    /**
     * @inheritdoc
     *
     * @memberof AttributeSchema
     */
    public isModifiedDate: boolean = false;

    /**
     * @inheritdoc
     *
     * @memberof AttributeSchema
     */
    public isDeletedDate: boolean = false;

    /**
     * @inheritdoc
     *
     * @memberof AttributeSchema
     */
    public isVersion: boolean = false;

    /**
     * @inheritdoc
     *
     * @memberof AttributeSchema
     */
    public isGenerated?: 'increment' | 'uuid' | 'rowid' | undefined;

    /**
     * defines if an attribute is a relation to its corresponding type and to
     * which field of this type
     *
     * @memberof AttributeSchema
     */
    public relation!: IRelation<T> | false;

    /**
     * If true, the column will be used as the relation column
     *
     * @memberof AttributeSchema
     */
    public isRelationOwner!: boolean;

    /**
     * @inheritdoc
     *
     * @memberof AttributeSchema
     */
    public cascade: AttrOptions<T>["cascade"];

    /**
     * @inheritdoc
     *
     * @memberof AttributeSchema
     */
    public createForeignKeyConstraints!: Exclude<AttrOptions<T>["createForeignKeyConstraints"], undefined>;

    /**
     * @inheritdoc
     *
     * @memberof AttributeSchema
     */
    public orphanedRowAction: AttrOptions<T>["orphanedRowAction"];

    /**
     * @inheritdoc
     *
     * @memberof AttributeSchema
     */
    public persistence!: Exclude<AttrOptions<T>["persistence"], undefined>;

    /**
     * @inheritdoc
     *
     * @memberof AttributeSchema
     */
    public primary?: AttrOptions<T>["primary"];

    private type!: IMetadata["type"];

    public constructor(ctor: T, attributeName: keyof InstanceType<T>, parameters: AttrOptionsPartialMetadataJson<T>) {
        this.ctor = ctor;
        this.attributeName = attributeName;
        this.parameters = parameters;
        this.collectModels();
        this.setConstants(parameters);
        this.activateSchema(parameters.type);
    }

    public updateParameters(parameters: AttrOptionsPartialMetadataJson<T>) {
        merge(this.parameters, parameters);
        this.setConstants(parameters);
        this.activateSchema(parameters.type);
    }

    private collectModels() {
        if (Object.keys(models).length) return;
        const context = require.context("~env/models/", true, /.+\.ts/, "sync");
        context.keys().forEach((key) => {
            models[pascalCase(key.substring(2, key.length - 3))] = context(key).default;
        });
    }

    private setConstants(params: AttrOptionsPartialMetadataJson<T>) {
        this.isRequired = Boolean(params.isRequired);
        this.isImmutable = Boolean(params.isReadOnly);
        this.isInternal = Boolean(params.isInternal);
        this.isLazy = Boolean(params.isLazy);
        this.primary = Boolean(params.primary);
        this.isCreationDate = Boolean(params.isCreationDate);
        this.isModifiedDate = Boolean(params.isModifiedDate);
        this.isDeletedDate = Boolean(params.isDeletedDate);
        this.isVersion = Boolean(params.isVersion);
        this.persistence = Boolean(params.persistence);

        this.isGenerated = params.isGenerated;
        this.cascade = params.cascade;
        this.orphanedRowAction = params.orphanedRowAction;
        this.type = params.type;

        const fieldRelations = params.oneToMany || params.manyToOne || params.manyToMany;
        if (fieldRelations || params.oneToOne) {
            let type: IRelation<T>["type"] = "many-to-many";
            if (params.oneToOne) {
                type = "one-to-one";
            } else if (params.oneToMany) {
                type = "one-to-many";
            } else if (params.manyToOne) type = "many-to-one";
            this.relation = { type };
            if (typeof fieldRelations === "string") this.relation.field = <keyof InstanceType<T>>fieldRelations;
        }
    }

    private activateSchema(type: IMetadata["type"]) {
        const typeMap: Record<string, any> = {
            Number: "double",
            String: "text",
            Boolean: "boolean",
            Date: "date",
            Object: "json"
        };

        const attrName = this.attributeName.toString();
        const options = {
            lazy: this.isLazy,
            cascade: this.cascade,
            createForeignKeyConstraints: this.createForeignKeyConstraints,
            nullable: !this.isRequired,
            orphanedRowAction: this.orphanedRowAction,
            persistence: this.persistence,
            array: type.isArray
        };

        if (this.primary) {
            PrimaryGeneratedColumn("uuid")(this.ctor, attrName);
        } else if (this.isGenerated) {
            Generated(this.isGenerated)(this.ctor, attrName);
        } else if (this.isCreationDate) {
            CreateDateColumn(options)(this.ctor, attrName);
        } else if (this.isModifiedDate) {
            UpdateDateColumn(options)(this.ctor, attrName);
        } else if (this.isDeletedDate) {
            DeleteDateColumn(options)(this.ctor, attrName);
        } else if (this.isVersion) {
            VersionColumn(options)(this.ctor, attrName);
        } else {
            let typeName = typeMap[type.identifier];
            if (type.isInterface) {
                typeName = "simple-json";
            } else if (type.isArray || type.isTuple) {
                typeName = "simple-array";
            }

            if (this.relation && this.isModel()) {
                const identifier = this.type.identifier || (<any>this.type.subType)[0]?.identifier;
                const field = this.relation.field;

                const typeFunc = () => models[identifier];
                // because we use the inverse func only when its a many relation,
                // the field is definitely assigned
                // eslint-disable-next-line
                const inverseFunc = (instance: InstanceType<ReturnType<typeof typeFunc>>) => Reflect.get(instance, field!);
                if (this.relation.type === "one-to-one") {
                    OneToOne(typeFunc, options)(this.ctor, attrName);
                    if (this.isRelationOwner) JoinColumn()(this.ctor, attrName);
                } else if (this.relation.type === "one-to-many") {
                    OneToMany(typeFunc, inverseFunc, options)(this.ctor, attrName);
                } else if (this.relation.type === "many-to-one") {
                    ManyToOne(typeFunc, inverseFunc, options)(this.ctor, attrName);
                } else {
                    let inverse = undefined;
                    if (field) inverse = (instance: InstanceType<T>) => Reflect.get(instance, field);
                    ManyToMany(() => models[this.ctor.name], inverse, options)(this.ctor, attrName);
                    if (this.isRelationOwner) JoinTable()(this.ctor, attrName);
                }
            } else Column(typeName, options)(this.ctor, attrName);
        }
    }

    private isModel() {
        return this.type.isModel || this.type.isArray && this.type.subTypes.every((subType) => subType.isModel);
    }
}
