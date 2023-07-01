import {
    Column,
    PrimaryGeneratedColumn,
    OneToOne,
    OneToMany,
    ManyToOne,
    ManyToMany,
    JoinTable,
    JoinColumn,
    Generated,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    VersionColumn,
    Index
} from "typeorm";
import DeepTypedSchema from "~env/lib/DeepTypedSchema";
import { embeddedEntityFactory } from "~env/lib/EmbeddedEntity";
import { AttributeError } from "~env/lib/Errors";
import Logger from "~env/lib/Logger";
import { baseTypeFuncs } from "~env/utils/schema";
import { getModelClassByName, pascalCase, isArray } from "~env/utils/utils";
import type { RelationOptions, IndexOptions } from "typeorm";
import type { ColumnType } from 'typeorm/driver/types/ColumnTypes';
import type {
    AttrOptions,
    AllColumnOptions,
    AttrOptionsPartialMetadataJson,
    IEmbeddedEntity,
    SchemaNameByModelClass,
    ObjectSchemaType,
    RelationDefinition
} from "~env/@types/AttributeSchema";
import type { ValidationResult } from "~env/@types/Errors";
import type {
    IArrayType,
    IAttrMetadata,
    IInterfaceType,
    MetadataType
} from "~env/@types/MetadataTypes";
import type { ModelLike } from "~env/@types/ModelClass";

const logger = new Logger("schema");

/**
 * Defines the schema for any attribute by defining
 *
 * - the type
 * - the constraints for eager or lazy behavior, immutability,
 *   shareability and so on (read the code for more)
 * - the relation by looking up partner attributes
 *
 * An attribute will be initialized by the @Attr() decorator.
 *
 * NOTE: If you are working with an AttributeSchema at construction time, you have to
 * take care of the status given by the method "awaitConstruction".
 * If the promise is resolved, the construction of the schema is complete and
 * contains the relation. Otherwise the relation might be missing.
 *
 * @template T The model where the schema of the attribute belongs to
 */
export default class AttributeSchema<T extends ModelLike> extends DeepTypedSchema<T> implements AttrOptions<T> {

    /**
     * The name of the attribute in the schema. Corresponds to the attribute
     * name in the class (maybe not in runtime)
     */
    declare public readonly name: keyof T;

    /**
     * @InheritDoc
     */
    declare public readonly options: Readonly<AttrOptionsPartialMetadataJson<T>>;

    /**
     * Provides the possibility to check if a value is an attribute schema.
     * HINT: This is mainly provided to avoid import loops. You should prefer
     * the usual instanceof check if possible.
     */
    public readonly isAttributeSchema: boolean = true;

    /**
     * Indicates if an attribute should NOT be sent to another endpoint.
     * Very important for privacy!
     */
    public isInternal!: boolean;

    /**
     * Indicates if an attribute is readonly / not writable / only writable once
     */
    public isImmutable!: boolean;

    /**
     * @InheritDoc
     */
    public isCreationDate!: boolean;

    /**
     * @InheritDoc
     */
    public isModifiedDate!: boolean;

    /**
     * @InheritDoc
     */
    public isDeletedDate!: boolean;

    /**
     * @InheritDoc
     */
    public isVersion!: boolean;

    /**
     * @InheritDoc
     */
    public isGenerated?: 'increment' | 'uuid' | 'rowid' | undefined;

    /**
     * defines if an attribute is a relation to its corresponding type and to
     * which field of this type
     */
    public relationColumn?: string;

    /**
     * If true, the column will be used as the relation column
     */
    public isRelationOwner!: boolean;

    /**
     * @InheritDoc
     */
    public createForeignKeyConstraints!: Exclude<AttrOptions<T>["createForeignKeyConstraints"], undefined>;

    /**
     * @InheritDoc
     */
    public orphanedRowAction: AttrOptions<T>["orphanedRowAction"];

    /**
     * Determines if this attribute is used as an index row in the database
     */
    public isIndex!: boolean;

    /**
     * @see IndexOptions
     */
    public indexOptions!: IndexOptions;

    /**
     * @InheritDoc
     */
    public persistence!: Exclude<AttrOptions<T>["persistence"], undefined>;

    /**
     * @InheritDoc
     *
     * NOTE: This will be set to true if the schema is fully built
     * (including relation).
     */
    declare protected _constructed: boolean;

    /**
     * If the relation ends up in an embedded entity, it will be stored here to
     * have access to its schema and to be able to generate the schema type of
     * this attribute schema.
     */
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore this is necessary because TypeScript seems to have problems with recursive definitions.
    private _embeddedEntity: ReturnType<typeof embeddedEntityFactory> | null = null;

    /**
     * Stores the result of building the relation. Is false if it is not a relation and RelationDefinition else.
     */
    private _relation?: RelationDefinition | false;

    public constructor(ctor: T, name: keyof T, internalName: string, options: AttrOptionsPartialMetadataJson<T>) {
        super(ctor, name, internalName, options);
        this.setConstants(options);
        this.buildSchema(options.type);
    }

    public get relation() {
        return this._relation;
    }

    public get embeddedEntity() {
        return this._embeddedEntity;
    }

    /**
     * @InheritDoc
     */
    public override updateOptions(options: Partial<AttrOptionsPartialMetadataJson<T>>) {
        super.updateOptions(options);
        this.setConstants(this.options);
        this.buildSchema(this.options.type);
    }

    /**
     * @InheritDoc
     */
    public async validate(value: unknown): Promise<ValidationResult> {
        return this.internalValidation(value, AttributeError);
    }

    /**
     * Returns the values of an union type when the type is a fully literal type
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns an empty array if is not a fully literal type and an array of strings or numbers else
     */
    public getUnionTypeValues(altType?: IAttrMetadata["type"]): (string | number)[] {
        const type = altType || this.rawType;
        const values: any[] = [];
        if (!this.isUnionType(type)) return values;

        for (const subType of type.subTypes) {
            if (this.isUnionType(subType)) {
                values.push(...this.getUnionTypeValues(subType));
            } else if (this.isLiteralType(subType) && "value" in subType) {
                values.push(subType.value);
            }
        }

        return values;
    }

    /**
     * Determines the relation type based on the type of both relation ends
     * and the relation column
     *
     * @returns null if no relation was found and the name corresponding to typeORMs relation names else
     */
    public async getRelationType() {
        if (!this.isModelType() && !(this.isArrayType() && this.isModelType((this.rawType as IArrayType).subType))) return null;
        const otherModel = await getModelClassByName(this.getTypeIdentifier() || "");
        const otherAttributeSchema = otherModel && otherModel.getAttributeSchema(this.relationColumn as SchemaNameByModelClass<typeof otherModel>);

        if (!this.isArrayType()) {
            if (!otherAttributeSchema) {
                return "OneToOne"; // Owner not needed
            } else if (otherAttributeSchema.isArrayType()) {
                return "ManyToOne"; // Owner not needed
            } else if (otherAttributeSchema.relationColumn && this.relationColumn) return "OneToOne"; // Owner has to be specified
        } else if (otherAttributeSchema) {
            if (!otherAttributeSchema.isArrayType()) return "OneToMany"; // owner not needed
            return "ManyToMany"; // owner has to be specified
        }
        logger.warn(`Could not determine a relation type for ${this.owner?.className}:${String(this.name)}`);
        return null;
    }

    /**
     * If not already existent, this will start the generation of the schema
     * type of this attribute and returns it.
     *
     * NOTE: This assumes that ALL models are already completely loaded to be
     * able to be sync which allows the model schema to build a lazy schema type
     * which then allows circular schema definitions.
     *
     * @returns at least a ZodAnyType
     */
    public override getSchemaType() {
        if (!this.schemaType) this.schemaType = this.buildSchemaType(this.rawType);
        return this.schemaType;
    }

    /**
     * Determines the simple column type and its corresponding options.
     * Both has to be compatible with the corresponding database of the
     * environment.
     *
     * @param type the type of the attribute
     * @param defaultOptions default options determined in the buildSchema() method of this attribute
     * @returns an array with two elements. first is the type, second are the options
     */
    protected getColumnTypeNameAndOptions(type: IAttrMetadata["type"], defaultOptions: AllColumnOptions): [ColumnType, AllColumnOptions] {
        let typeName: ColumnType = "text";
        if (this.isArrayType(type) || this.isTupleType(type)) {
            typeName = "simple-array";
            defaultOptions.array = true;
        }
        if (this.isPlainObjectType(type) || this.isRecordType(type)) typeName = "simple-json";
        if (this.isNumberType(type)) typeName = "double precision"; // because every number in javascript is a double
        if (this.isBooleanType(type)) typeName = "boolean";
        if (this.isDateType(type)) typeName = "date";
        if (this.isUnionType(type)) {
            typeName = "simple-enum";
            defaultOptions.enum = this.getUnionTypeValues(type);
        }
        if (this.isCustomType(type)) typeName = type.identifier;
        return [typeName, defaultOptions];
    }

    /**
     * Creates a basic entity (not a real model) with class name and the members
     * of the given type which results from an interface which will be injected
     * to runtime during compile time.
     *
     * @param attributeName the name of the attribute which will be an embedded entity
     * @param type the type of the attribute
     */
    protected buildEmbeddedEntity(attributeName: string, type: IAttrMetadata["type"]): ReturnType<typeof embeddedEntityFactory> | null {
        let embeddedType: MetadataType | MetadataType[] = type;
        if (this.isArrayType(type) && !this.isTupleType(type)) embeddedType = type.subType;
        if (this.isTupleType(type) && type.subTypes.every((subType) => this.isPlainObjectType(subType))) embeddedType = type.subTypes;
        if (!this.isValidEmbeddedType(embeddedType)) return null;
        if (!isArray(embeddedType)) embeddedType = [embeddedType];

        const className = `${this.owner?.className || ""}${pascalCase(attributeName)}EmbeddedEntity`;
        const members = this.getEmbeddedEntityMembers(embeddedType as IInterfaceType[]);

        return embeddedEntityFactory(className, members);
    }

    protected isValidEmbeddedType(embeddedType: MetadataType | MetadataType[] | null): embeddedType is IInterfaceType | IInterfaceType[] {
        return Boolean(embeddedType && (
            embeddedType instanceof Array && embeddedType.every((subType) => this.isPlainObjectType(subType)) ||
            !(embeddedType instanceof Array) && (
                this.isPlainObjectType(embeddedType) ||
                this.isIntersectionType(embeddedType) && embeddedType.subTypes.every(this.isPlainObjectType.bind(this)))));
    }

    protected getEmbeddedEntityMembers(embeddedType: IInterfaceType[]): Record<string, any> {
        const members: Record<string, any> = {};
        for (const type of embeddedType) {
            if (this.isIntersectionType(type)) {
                Object.assign(members, this.getEmbeddedEntityMembers(type.subTypes as IInterfaceType[]));
            } else Object.assign(members, type.members);
        }
        return members;
    }

    /**
     * Sets all given constraints on this schema and decides which behavior
     * (lazy or eager) will be applied and so on
     *
     * @param options an object with constraints to set on this attribute schema
     */
    protected override setConstants(options: AttrOptionsPartialMetadataJson<T>) {
        super.setConstants(options);

        this.isImmutable = Boolean(options.isReadOnly);
        this.isInternal = Boolean(options.isInternal);
        this.isCreationDate = Boolean(options.isCreationDate);
        this.isModifiedDate = Boolean(options.isModifiedDate);
        this.isDeletedDate = Boolean(options.isDeletedDate);
        this.isVersion = Boolean(options.isVersion);
        this.isIndex = Boolean(options.index);
        this.persistence = options.persistence ?? true;

        this.isGenerated = options.isGenerated;
        this.orphanedRowAction = options.orphanedRowAction ?? "delete";
        this.isRelationOwner = Boolean(options.isRelationOwner);
        this.relationColumn = options.relationColumn;

        if (options.index && typeof options.index !== "boolean") {
            this.indexOptions = options.index;
        } else this.indexOptions = {};
    }

    /**
     * @InheritDoc
     *
     * @returns The schema type of the embedded entity if exists and a never type else
     */
    protected buildPlainObjectSchemaType(): ObjectSchemaType {
        if (this._embeddedEntity) {
            const result = this._embeddedEntity.getSchema()?.getSchemaType() as ObjectSchemaType;
            return result || baseTypeFuncs.never();
        }
        return baseTypeFuncs.never();
    }

    /**
     * Determines some default option for each column and the type of the column.
     * If the type is somehow a model, it will build the corresponding relation,
     * based on the type of both relation ends.
     *
     * @param type the type which should be used to build the schema
     */
    private async buildSchema(type: IAttrMetadata["type"], altProto?: object, altAttrName?: string) {
        // This is the correction described in decorator @Attr()
        const proto = altProto || this._ctor.prototype;
        const attrName = altAttrName || this.name.toString();
        const defaultOptions: AllColumnOptions = {
            lazy: this.isLazy,
            eager: this.isEager,
            createForeignKeyConstraints: this.createForeignKeyConstraints,
            nullable: !this.isRequired,
            orphanedRowAction: this.orphanedRowAction,
            persistence: this.persistence
        };

        const [typeName, options] = this.getColumnTypeNameAndOptions(type, defaultOptions);

        if (this.primary) {
            PrimaryGeneratedColumn("uuid")(proto, attrName);
        } else if (this.isGenerated) {
            Generated(this.isGenerated)(proto, attrName);
        } else if (this.isCreationDate) {
            CreateDateColumn(options)(proto, attrName);
        } else if (this.isModifiedDate) {
            UpdateDateColumn(options)(proto, attrName);
        } else if (this.isDeletedDate) {
            DeleteDateColumn(options)(proto, attrName);
        } else if (this.isVersion) {
            VersionColumn(options)(proto, attrName);
        } else if (!(this._relation = await this.buildRelation(attrName, options))) {
            this._embeddedEntity = this.buildEmbeddedEntity(attrName, type);
            // eslint-disable-next-line @typescript-eslint/ban-types
            let usedType: ColumnType | (() => Function | IEmbeddedEntity) = typeName;
            if (this._embeddedEntity) usedType = () => this._embeddedEntity as ReturnType<typeof embeddedEntityFactory>;
            logger.debug(`Creating column ${this._ctor.name}#${attrName}: ${usedType} = ${JSON.stringify(options)}`);
            Column(usedType as any, options)(proto, attrName);
        }

        if (this.isIndex) Index(this.indexOptions)(proto as any);
        this._constructed = true;
    }

    /**
     * Builds the relation when the attribute is somehow a model and takes
     * the relation column into account. It also determines the
     * relation column / relation table if possible.
     *
     * @param attributeName the name of the attribute to find relation for
     * @param options options for the relation
     * @returns true if a relation was build and false else
     */
    private async buildRelation(attributeName: string, options: RelationOptions): Promise<false | RelationDefinition> {
        if (!this.isModelType()) return false;
        const identifier = this.getTypeIdentifier() || "";
        if (!identifier) return false;
        const proto = this._ctor.prototype;

        const otherModel = await getModelClassByName(identifier);
        if (!otherModel) return false;

        const typeFunc = () => otherModel;
        // eslint-disable-next-line
        const inverseFunc = (instance: InstanceType<ReturnType<typeof typeFunc>>) => Reflect.get(instance, this.relationColumn!);

        let inverse: typeof inverseFunc | undefined = undefined;
        if (this.relationColumn) inverse = inverseFunc;

        const relationTypes = {
            OneToOne: OneToOne(typeFunc, options),
            OneToMany: OneToMany(typeFunc, inverseFunc, options),
            ManyToOne: ManyToOne(typeFunc, inverseFunc, options),
            ManyToMany: ManyToMany(typeFunc, inverse, options)
        };

        const relationType = await this.getRelationType();
        if (!relationType) return false;

        logger.debug(`Creating column ${this._ctor.name}#${attributeName}: ${otherModel.name} = ${relationType}#${JSON.stringify(options)}`);
        relationTypes[relationType](proto, attributeName);
        const isArray = ["ManyToMany", "OneToMany"].includes(relationType);
        Column(isArray ? "text" : "uuid", { nullable: true, array: isArray })(proto, `${attributeName}Id`);

        if (["OneToOne", "ManyToOne"].includes(relationType)) {
            JoinColumn()(proto, attributeName);
        } else if (this.isRelationOwner && relationType === "ManyToMany") JoinTable()(proto, attributeName);

        return { type: relationType, mirrorClass: otherModel, mirrorAttributeName: this.relationColumn };
    }

}
