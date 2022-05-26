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
import { ZodNumber, ZodString } from "zod";
import * as DataTypes from "~common/lib/DataTypes";
import { AttributeError } from "~common/lib/Errors";
import MetadataStore from "~common/lib/MetadataStore";
import { baseTypeFuncs } from "~common/utils/schema";
import { merge, getModelClassByName, hasOwnProperty, pascalCase } from "~common/utils/utils";
import type { Constructor } from "type-fest";
import type { RelationOptions, IndexOptions } from "typeorm";
import type { ColumnType } from 'typeorm/driver/types/ColumnTypes';
import type { AttrOptions, AllColumnOptions, AttrOptionsPartialMetadataJson, IEmbeddedEntity, SchemaNameByModelClass, SchemaTypes } from "~common/@types/AttributeSchema";
import type { CombinedDataType, IArrayType, IAttrMetadata, ICustomType, IIdentifiedType, IInterfaceType, IIntersectionType, ILiteralType, IModelType, INullType, IOptionalType, ITupleType, IUndefinedType, IUnionType, IUnresolvedType, MetadataType, ObjectLikeDataType } from "~common/@types/MetadataTypes";
import type BaseModel from "~common/lib/BaseModel";

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
export default class AttributeSchema<T extends typeof BaseModel> implements AttrOptions<T> {

    /**
     * Holds the class object which created the schema. This is only a valid
     * value after processing the schema of the class!
     */
    public readonly owner?: T;

    /**
     * The name of the attribute in the schema. Corresponds to the attribute
     * name in the class (maybe not in runtime)
     */
    public readonly attributeName: keyof T;

    /**
     * The parameters which initializes the schema
     */
    public readonly parameters = {} as Readonly<AttrOptionsPartialMetadataJson<T>>;

    /**
     * Indicates if an attribute should be sent to another endpoint.
     * Very important for privacy!
     */
    public isInternal: boolean = false;

    /**
     * Indicates if an attribute has to be set manually (does not have a default)
     */
    public isRequired: boolean = false;

    /**
     * Indicates if an attribute is readonly / not writable / only writable once
     */
    public isImmutable: boolean = false;

    /**
     * @inheritdoc
     */
    public min?: number;

    /**
     * @inheritdoc
     */
    public max?: number;

    /**
     * @inheritdoc
     */
    public multipleOf?: number;

    /**
     * @inheritdoc
     */
    public validator?: keyof typeof DataTypes;

    /**
     * Indicates if an attribute should only be loaded from database when it
     * is explicitly used. This is always the case when the type of the
     * attribute is a Promise
     */
    public isLazy: boolean = false;

    /**
     * @see AllColumnOptions["eager"]
     */
    public isEager: boolean = false;

    /**
     * @inheritdoc
     */
    public isCreationDate: boolean = false;

    /**
     * @inheritdoc
     */
    public isModifiedDate: boolean = false;

    /**
     * @inheritdoc
     */
    public isDeletedDate: boolean = false;

    /**
     * @inheritdoc
     */
    public isVersion: boolean = false;

    /**
     * @inheritdoc
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
     * @inheritdoc
     */
    public cascade: AttrOptions<T>["cascade"];

    /**
     * @inheritdoc
     */
    public createForeignKeyConstraints!: Exclude<AttrOptions<T>["createForeignKeyConstraints"], undefined>;

    /**
     * @inheritdoc
     */
    public orphanedRowAction: AttrOptions<T>["orphanedRowAction"];

    /**
     * Determines if this attribute is used as an index row in the database
     */
    public isIndex!: boolean;

    /**
     * @see IndexOptions
     */
    public indexOptions: IndexOptions = {};

    /**
     * @inheritdoc
     */
    public persistence!: Exclude<AttrOptions<T>["persistence"], undefined>;

    /**
     * @inheritdoc
     */
    public primary?: AttrOptions<T>["primary"];

    /**
     * Holds the "ready to validate" schema of the type
     */
    private schemaType: SchemaTypes | null = null;

    /**
     * The type which was determined during compile time
     */
    private rawType!: IAttrMetadata["type"];

    /**
     * This is the original class type which is used while construction.
     * Use this.ctor during runtime, which is the evaluated version of this one
     */
    private readonly _ctor: T;

    /**
     * Internal state which determines if the schema is fully built or not.
     * NOTE: This will be set to true if the schema is fully built
     * (including relation).
     */
    private _constructed = false;

    public constructor(ctor: T, attributeName: keyof T, parameters: AttrOptionsPartialMetadataJson<T>) {
        this._ctor = ctor;
        this.attributeName = attributeName;
        this.parameters = parameters;
        this.setConstants(parameters);
        this.buildSchema(parameters.type);
    }

    /**
     * Returns a promise which resolves when the schema was built the first time.
     * Useful to ensure the correct order of decorator execution during setup.
     *
     * @returns a resolving promise
     */
    public awaitConstruction() {
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (!this._constructed) return;
                clearInterval(interval);
                resolve(true);
            });
        });
    }

    /**
     * Sets the model class for later use to be able to navigate through the models
     *
     * @param owner the class of the model to set
     */
    public setOwner(owner: T) {
        if ((this._ctor as InstanceType<T>).className !== (owner as InstanceType<T>).className) return;
        // @ts-expect-error this is needed to be able to provide the ctor at runtime after construction
        this.owner = owner;
    }

    /**
     * updates the parameters and rebuilds constraints and schema depending
     * on new parameters
     *
     * @param parameters Parameters of this attribute
     */
    public updateParameters(parameters: AttrOptionsPartialMetadataJson<T>) {
        merge(this.parameters, parameters);
        this.setConstants(parameters);
        this.buildSchema(parameters.type);
    }

    /**
     * Checks if the given value is valid like defined by the schema type
     *
     * @param value the value to check
     * @returns true if valid and an error else
     */
    public validate(value: unknown) {
        const name = this.attributeName.toString();

        const result = this.getSchemaType().safeParse(value);
        if (!result.success) {
            const errors: AttributeError[] = [];
            result.error.issues.forEach((issue) => {
                if (issue.message === "Required") {
                    errors.push(new AttributeError(name, "required", issue.path, value));
                } else errors.push(new AttributeError(name, "type", issue.path, value));
            });
            return new AggregateError(errors);
        }

        return true;
    }

    /**
     * Determines if this attribute is somehow a union type.
     * This does **NOT** include arrays of unions!
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is a union type else false
     */
    public isUnionType(altType?: IAttrMetadata["type"]): altType is IUnionType {
        const type = altType || this.rawType;
        return Boolean("isUnion" in type && type.isUnion);
    }

    /**
     * Determines if this attribute is somehow a intersection type.
     * This does **NOT** include arrays of intersections!
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is a intersection type else false
     */
    public isIntersectionType(altType?: IAttrMetadata["type"]): altType is IIntersectionType {
        const type = altType || this.rawType;
        return Boolean("isIntersection" in type && type.isIntersection);
    }

    /**
     * Determines if this attribute is somehow a literal type.
     * This includes arrays of literals!
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is a literal type else false
     */
    public isLiteralType(altType?: IAttrMetadata["type"]): altType is CombinedDataType<ILiteralType> {
        const type = altType || this.rawType;
        return "isLiteral" in type && type.isLiteral || this.checkSubTypes(type, this.isLiteralType.bind(this));
    }

    /**
     * Determines if this attribute is somehow a string type.
     * This includes arrays of strings!
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is a string type else false
     */
    public isStringType(altType?: IAttrMetadata["type"]): altType is CombinedDataType<IIdentifiedType<"String"> | ILiteralType<string>> {
        const type = altType || this.rawType;
        return "isStringLiteral" in type && type.isStringLiteral || "identifier" in type && type.identifier === "String" || this.checkSubTypes(type, this.isStringType.bind(this));
    }

    /**
     * Determines if this attribute is somehow a number type.
     * This includes arrays of numbers!
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is a number type else false
     */
    public isNumberType(altType?: IAttrMetadata["type"]): altType is CombinedDataType<IIdentifiedType<"Number"> | ILiteralType<number>> {
        const type = altType || this.rawType;
        return "isNumberLiteral" in type && type.isNumberLiteral || "identifier" in type && type.identifier === "Number" || this.checkSubTypes(type, this.isNumberType.bind(this));
    }

    /**
     * Determines if this attribute is somehow a boolean type.
     * This includes arrays of booleans!
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is a boolean type else false
     */
    public isBooleanType(altType?: IAttrMetadata["type"]): altType is CombinedDataType<IIdentifiedType<"Boolean">> {
        const type = altType || this.rawType;
        return "identifier" in type && type.identifier === "Boolean" || this.checkSubTypes(type, this.isBooleanType.bind(this));
    }

    /**
     * Determines if this attribute is somehow a date type.
     * This includes arrays of dates!
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is a date type else false
     */
    public isDateType(altType?: IAttrMetadata["type"]): altType is CombinedDataType<IIdentifiedType<"Date">> {
        const type = altType || this.rawType;
        return "identifier" in type && type.identifier === "Date" || this.checkSubTypes(type, this.isDateType.bind(this));
    }

    /**
     * Determines if this attribute is somehow a model type.
     * This includes arrays of models!
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is a model type else false
     */
    public isModelType(altType?: IAttrMetadata["type"]): altType is CombinedDataType<IModelType> {
        const type = altType || this.rawType;
        return Boolean("isModel" in type && type.isModel || this.checkSubTypes(type, this.isModelType.bind(this)));
    }

    /**
     * Determines if this attribute is an array type. This does NOT include tuples
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is an array type else false
     */
    public isArrayType(altType?: IAttrMetadata["type"]): altType is IArrayType {
        const type = altType || this.rawType;
        return "isArray" in type && type.isArray;
    }

    /**
     * Determines if this attribute is a tuple type. This does NOT include
     * regular arrays.
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is a tuple type else false
     */
    public isTupleType(altType?: IAttrMetadata["type"]): altType is ITupleType {
        const type = altType || this.rawType;
        return "isTuple" in type && type.isTuple;
    }

    /**
     * Determines if this attribute has an optional type
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is an optional type else false
     */
    public isOptionalType(altType?: IAttrMetadata["type"]): altType is IOptionalType {
        const type = altType || this.rawType;
        return "isOptional" in type && type.isOptional;
    }

    /**
     * Determines if the type of the attribute is an identifies type (means a
     * type with an explizite name).
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is an identified type else false
     */
    public hasIdentifier(altType?: IAttrMetadata["type"]): altType is IModelType | IIdentifiedType {
        const type = altType || this.rawType;
        return "identifier" in type;
    }

    /**
     * Determines if this attribute is somehow an object type.
     * This includes arrays of objects and arrays itself as well as models!
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is a model type else false
     */
    public isObjectLikeType(altType?: IAttrMetadata["type"]): altType is ObjectLikeDataType {
        const type = altType || this.rawType;
        return "isInterface" in type && type.isInterface || "isIntersection" in type && type.isIntersection || this.isModelType(type) || this.checkSubTypes(type, this.isObjectLikeType.bind(this));
    }

    /**
     * Determines if this attribute is somehow a plain object type.
     * This does **NOT** include arrays or models but arrays of plain objects!
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is a model type else false
     */
    public isPlainObjectType(altType?: IAttrMetadata["type"]): altType is IInterfaceType {
        const type = altType || this.rawType;
        return Boolean("isInterface" in type && type.isInterface || this.checkSubTypes(type, this.isPlainObjectType.bind(this)));
    }

    /**
     * Determines if this attribute contains somehow an unresolved type.
     * This includes arrays of unresolved types too. An array of unresolved
     * types is given, if the array contains at least one unresolved type.
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is a model type else false
     */
    public isUnresolvedType(altType?: IAttrMetadata["type"]): altType is CombinedDataType<IUnresolvedType> {
        const type = altType || this.rawType;
        return "isMixed" in type && type.isMixed || "isUnresolvedType" in type && type.isUnresolvedType || this.checkSubTypes(type, this.isUnresolvedType.bind(this));
    }

    /**
     * Determines if the type of this attribute is undefined
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is an undefined type else false
     */
    public isUndefinedType(altType?: IAttrMetadata["type"]): altType is IUndefinedType {
        const type = altType || this.rawType;
        return "isUndefined" in type && type.isUndefined;
    }

    /**
     * Determines if the type of this attribute is null
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is a null type else false
     */
    public isNullType(altType?: IAttrMetadata["type"]): altType is INullType {
        const type = altType || this.rawType;
        return "isNull" in type && type.isNull;
    }

    /**
     * Determines if the type of this attribute is a custom defined type.
     * This type looks like an identified type but behaves different in
     * determination of database type name and schema type generation.
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is a custom type else false
     */
    public isCustomType(altType?: IAttrMetadata["type"]): altType is ICustomType {
        const type = altType || this.rawType;
        return "isCustomType" in type && type.isCustomType;
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
            if (!this.isLiteralType(subType)) return [];
            values.push(subType.value);
        }

        return values;
    }

    /**
     * Determines a flat version of the type identifier. The max depth is 1
     *
     * @param [altType] alternative type to get identifier from
     * @returns the name of the identifier if exists
     */
    public getTypeIdentifier(altType?: IAttrMetadata["type"]): string | undefined {
        const type = altType || this.rawType;
        if (this.isTupleType(type)) return type.subTypes.find(this.hasIdentifier.bind(this))?.identifier;
        if (this.isArrayType(type) && this.hasIdentifier(type.subType)) return type.subType.identifier;
        if (this.hasIdentifier(type)) return type.identifier;
    }

    /**
     * Determines the relation type based on the type of both relation ends
     * and the relation column
     *
     * @returns null if no relation was found and the name corresponding to typeORMs relation names else
     */
    public async getRelationType() {
        if (!this.isModelType()) return null;
        const otherModel = await getModelClassByName(this.getTypeIdentifier() || "");
        const otherAttributeSchema = otherModel && otherModel.getAttributeSchema(this.relationColumn as SchemaNameByModelClass<typeof otherModel>);

        if (!this.isArrayType()) {
            if (!this.relationColumn) return "OneToOne"; // owner is determined automatically
            if (otherAttributeSchema && (otherAttributeSchema.isArrayType() || otherAttributeSchema.isTupleType())) return "ManyToOne"; // owner not needed
        } else if (this.relationColumn) {
            if (otherAttributeSchema && !otherAttributeSchema.isArrayType() && !otherAttributeSchema.isTupleType()) return "OneToMany"; // owner not needed
            return "ManyToMany"; // owner has to be specified
        }
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
    public getSchemaType() {
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
        if (this.isPlainObjectType(type)) typeName = "simple-json";
        if (this.isNumberType(type)) typeName = "double"; // because every number in javascript is a double
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
    protected buildEmbeddedEntity(attributeName: string, type: IAttrMetadata["type"]): IEmbeddedEntity | null {
        let embeddedType: MetadataType | MetadataType[] | null = null;
        if (this.isArrayType(type)) embeddedType = type.subType;
        if (this.isTupleType(type) && type.subTypes.every((subType) => this.isPlainObjectType(subType))) embeddedType = type.subTypes;
        if (!this.isValidEmbeddedType(embeddedType)) return null;

        const metadataStore = new MetadataStore();
        const className = `${pascalCase(attributeName)}EmbeddedEntity`;
        class EmbeddedEntity {
            public static className: string = className;
        }

        if (!(embeddedType instanceof Array)) embeddedType = [embeddedType];

        for (const type of embeddedType) {
            for (const memberKey in type.members) {
                if (hasOwnProperty(type.members, memberKey)) {
                    const memberType = type.members[memberKey];
                    const attr = new AttributeSchema(EmbeddedEntity as any, memberKey as any, memberType);
                    metadataStore.setAttributeSchema(EmbeddedEntity as any, memberKey as any, attr);
                }
            }
        }

        return EmbeddedEntity;
    }

    protected isValidEmbeddedType(embeddedType: MetadataType | MetadataType[] | null): embeddedType is IInterfaceType | IInterfaceType[] {
        return Boolean(embeddedType && (embeddedType instanceof Array && embeddedType.every((subType) => this.isPlainObjectType(subType)) || !(embeddedType instanceof Array) && this.isPlainObjectType(embeddedType)));
    }

    /**
     * Checks if sub type containing types are all of same type checked by the checkFunc
     *
     * @param arrayLikeType type to check for same type sub types
     * @param checkFunc function that will be called to check the sub types
     * @returns true if all types are of type checked by checkFunc and false else
     */
    private checkSubTypes(arrayLikeType: IAttrMetadata["type"], checkFunc: ((type?: IAttrMetadata["type"]) => boolean)): boolean {
        if (this.isUnionType(arrayLikeType)) {
            return arrayLikeType.subTypes.every(checkFunc.bind(this));
        }

        if (this.isArrayType(arrayLikeType)) {
            return Boolean(this.isUnionType(arrayLikeType.subType) && arrayLikeType.subType.subTypes.every(checkFunc.bind(this)) || this.isModelType(arrayLikeType.subType) && arrayLikeType.subType.isModel);
        }
        if (this.isTupleType(arrayLikeType)) {
            return arrayLikeType.subTypes.every((subType) => {
                if (this.isOptionalType(subType)) return checkFunc(subType.subType);
                return checkFunc(subType);
            });
        }

        return false;
    }

    /**
     * Sets all given constraints on thi schema and decides which behavior
     * (lazy or eager) will be applied and wether this attribute will cascade
     * or not.
     *
     * @param params an object with constraints to set on this attribute schema
     */
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
        this.isIndex = Boolean(params.index);
        this.persistence = params.persistence ?? true;

        this.isGenerated = params.isGenerated;
        this.orphanedRowAction = params.orphanedRowAction ?? "delete";
        this.rawType = params.type;
        this.isRelationOwner = Boolean(params.isRelationOwner);
        this.relationColumn = params.relationColumn;

        this.min = params.min;
        this.max = params.max;
        this.multipleOf = params.multipleOf;
        this.validator = params.validator;

        if (!this.isRelationOwner) {
            this.isEager = !this.isLazy;
            this.cascade = params.cascade ?? true;
        } else this.cascade = params.cascade ?? false;

        if (params.index && typeof params.index !== "boolean") this.indexOptions = params.index;
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
        const attrName = altAttrName || this.attributeName.toString();
        const defaultOptions: AllColumnOptions = {
            lazy: this.isLazy,
            eager: this.isEager,
            cascade: this.cascade,
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
        } else if (!await this.buildRelation(attrName, options)) {
            const embeddedEntity = this.buildEmbeddedEntity(attrName, type);
            // eslint-disable-next-line @typescript-eslint/ban-types
            let usedType: ColumnType | (() => Function | IEmbeddedEntity) = typeName;
            if (embeddedEntity) usedType = () => embeddedEntity;
            console.debug(`Creating column ${this._ctor.name}#${attrName}: ${usedType} = ${JSON.stringify(options)}`);
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
    private async buildRelation(attributeName: string, options: RelationOptions) {
        const proto = this._ctor.prototype;
        const otherModel = await getModelClassByName(this.getTypeIdentifier() || "");
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
        console.debug(`Creating column ${this._ctor.name}#${attributeName}: ${otherModel.name} = ${relationType}#${JSON.stringify(options)}`);
        relationTypes[relationType](proto, attributeName);
        if (relationType === "OneToOne") {
            JoinColumn()(proto, attributeName);
        } else if (this.isRelationOwner) JoinTable()(proto, attributeName);
        return true;
    }

    /**
     * Generates a schema which will be used to validate a value. This schema is
     * a pure data schema and depends completely on the attributes type.
     * This also takes isRequired and other constraints into account (see end of method).
     *
     * NOTE: This assumes that all models are already loaded to have access
     * to the MODEL_NAME_TO_MODEL_MAP which allows to be sync which is needed
     * for circular schema definitions.
     *
     * @param type type to build schema from
     * @returns at least a "ZodAnyType"
     */
    private buildSchemaType(type: IAttrMetadata["type"]): SchemaTypes {
        let schemaType: SchemaTypes = baseTypeFuncs.any();

        // eslint-disable-next-line import/namespace
        if (this.validator && DataTypes[this.validator]) {
            // eslint-disable-next-line import/namespace
            schemaType = DataTypes[this.validator]({ min: this.min, max: this.max }).schemaType;
        } else if (this.isTupleType(type)) {
            const tupleTypes = type.subTypes.map((subType) => this.buildSchemaType(subType));
            schemaType = baseTypeFuncs.tuple(tupleTypes as [SchemaTypes, ...SchemaTypes[]]);
        } else if (this.isArrayType(type)) {
            schemaType = baseTypeFuncs.array(this.buildSchemaType(type.subType));
        } else if (this.isOptionalType(type)) {
            schemaType = baseTypeFuncs.optional(this.buildSchemaType(type.subType));
        } else if (this.isModelType(type)) {
            const typeIdentifier = this.getTypeIdentifier() || "";
            const modelClass = global.MODEL_NAME_TO_MODEL_MAP[typeIdentifier];
            const modelSchema = modelClass?.getSchema();
            schemaType = modelClass && modelSchema?.getSchemaType()?.or(baseTypeFuncs.instanceof(modelClass as unknown as Constructor<BaseModel>)) || baseTypeFuncs.any();
        } else if (this.isPlainObjectType(type)) {
            schemaType = baseTypeFuncs.object(Object.fromEntries(Object.entries(type.members).map((entry) => {
                const value = this.buildSchemaType(entry[1].type);
                return [entry[0], value];
            })));
        } else if (this.isIntersectionType(type) || this.isUnionType(type)) {
            const subTypes = type.subTypes.slice();
            schemaType = this.buildSchemaType(subTypes.shift() as MetadataType);
            for (const subType of subTypes) {
                const subSchemaType = this.buildSchemaType(subType);
                if (this.isIntersectionType(type)) {
                    schemaType = schemaType.and(subSchemaType);
                } else schemaType = schemaType.or(subSchemaType);
            }
        } else if (this.isNullType(type)) {
            schemaType = baseTypeFuncs.null();
        } else if (this.isUndefinedType(type)) {
            schemaType = baseTypeFuncs.undefined();
        } else if (this.isLiteralType(type)) {
            schemaType = baseTypeFuncs.literal(type.value);
        } else if (this.isStringType(type)) {
            schemaType = baseTypeFuncs.string();
        } else if (this.isNumberType(type)) {
            schemaType = baseTypeFuncs.number();
        } else if (this.isBooleanType(type)) {
            schemaType = baseTypeFuncs.boolean();
        } else if (this.isDateType()) {
            schemaType = baseTypeFuncs.date();
        }

        let min = -Infinity;
        if (this.isStringType(type)) min = 0;
        if (this.min !== undefined) min = this.min;
        if (schemaType instanceof ZodNumber) {
            schemaType.gte(min);
        } else if (schemaType instanceof ZodString) schemaType.min(min);

        let max = Infinity;
        if (this.max !== undefined) max = this.max;
        if (schemaType instanceof ZodNumber) {
            schemaType.lte(max);
        } else if (schemaType instanceof ZodString) schemaType.max(max);

        if (!this.isRequired) schemaType = baseTypeFuncs.optional(schemaType);
        if (this.isLazy) schemaType = schemaType.or(baseTypeFuncs.promise(schemaType));

        console.debug(`Created schema type ${this._ctor.name}#${this.attributeName}: ${schemaType._def.typeName}`);
        return schemaType;
    }
}
