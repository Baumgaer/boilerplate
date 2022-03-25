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
import { merge, getModelClassByName } from "~common/utils/utils";
import type { RelationOptions, IndexOptions } from "typeorm";
import type { ColumnType } from 'typeorm/driver/types/ColumnTypes';
import type BaseModel from "~common/lib/BaseModel";
import type { AttrOptions, AttrOptionsPartialMetadataJson, AllColumnOptions } from "~common/types/AttributeSchema";
import type { IAttrMetadata } from "~common/types/MetadataTypes";

export default class AttributeSchema<T extends typeof BaseModel> implements AttrOptions<T> {

    /**
     * Holds the class object which created the schema. This is only a valid
     * value after processing the schema of the class!
     *
     * @memberof AttributeSchema
     */
    public readonly modelClass?: T;

    /**
     * The name of the attribute in the schema. Corresponds to the attribute
     * name in the class (maybe not in runtime)
     *
     * @memberof AttributeSchema
     */
    public readonly attributeName: keyof T;

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
     * @see AllColumnOptions["eager"]
     *
     * @memberof AttributeSchema
     */
    public isEager: boolean = false;

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
    public relationColumn?: string;

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
     * Determines if this attribute is used as an index row in the database
     *
     * @memberof AttributeSchema
     */
    public isIndex!: boolean;

    /**
     * @see IndexOptions
     *
     * @memberof AttributeSchema
     */
    public indexOptions: IndexOptions = {};

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

    /**
     * The type which was determined during compile time
     *
     * @private
     * @memberof AttributeSchema
     */
    private type!: IAttrMetadata["type"];

    /**
     * This is the original class type which is used while construction.
     * Use this.ctor during runtime, which is the evaluated version of this one
     *
     * @private
     * @memberof AttributeSchema
     */
    private readonly _ctor: T;

    /**
     * Internal state which determines if the schema is fully built or not
     *
     * @private
     * @memberof AttributeSchema
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
     * @memberof AttributeSchema
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
     * @param modelClass the class of the model to set
     * @memberof AttributeSchema
     */
    public setModelClass(modelClass: T) {
        if ((this._ctor as InstanceType<T>).className !== (modelClass as InstanceType<T>).className) return;
        // @ts-expect-error this is needed to be able to provide the ctor at runtime after construction
        this.modelClass = modelClass;
    }

    /**
     * updates the parameters and rebuilds constraints and schema depending
     * on new parameters
     *
     * @param parameters Parameters of this attribute
     * @memberof AttributeSchema
     */
    public updateParameters(parameters: AttrOptionsPartialMetadataJson<T>) {
        merge(this.parameters, parameters);
        this.setConstants(parameters);
        this.buildSchema(parameters.type);
    }

    /**
     * Determines if this attribute is somehow a union type.
     * This does **NOT** include arrays of unions!
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is a union type else false
     * @memberof AttributeSchema
     */
    public isUnionType(altType?: IAttrMetadata["type"]): boolean {
        const type = altType || this.type;
        return Boolean(type.isUnion);
    }

    /**
     * Determines if this attribute is somehow a intersection type.
     * This does **NOT** include arrays of intersections!
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is a intersection type else false
     * @memberof AttributeSchema
     */
    public isIntersectionType(altType?: IAttrMetadata["type"]): boolean {
        const type = altType || this.type;
        return Boolean(type.isIntersection);
    }

    /**
     * Determines if this attribute is somehow a literal type.
     * This includes arrays of literals!
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is a literal type else false
     * @memberof AttributeSchema
     */
    public isLiteralType(altType?: IAttrMetadata["type"]): boolean {
        const type = altType || this.type;
        return type.isLiteral || this.checkSubTypes(type, this.isLiteralType.bind(this));
    }

    /**
     * Determines if this attribute is somehow a string type.
     * This includes arrays of strings!
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is a string type else false
     * @memberof AttributeSchema
     */
    public isStringType(altType?: IAttrMetadata["type"]): boolean {
        const type = altType || this.type;
        return type.isStringLiteral || type.identifier === "String" || this.checkSubTypes(type, this.isStringType.bind(this));
    }

    /**
     * Determines if this attribute is somehow a number type.
     * This includes arrays of numbers!
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is a number type else false
     * @memberof AttributeSchema
     */
    public isNumberType(altType?: IAttrMetadata["type"]): boolean {
        const type = altType || this.type;
        return type.isNumberLiteral || type.identifier === "Number" || this.checkSubTypes(type, this.isNumberType.bind(this));
    }

    /**
     * Determines if this attribute is somehow a boolean type.
     * This includes arrays of booleans!
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is a boolean type else false
     * @memberof AttributeSchema
     */
    public isBooleanType(altType?: IAttrMetadata["type"]): boolean {
        const type = altType || this.type;
        return type.identifier === "Boolean" || this.checkSubTypes(type, this.isBooleanType.bind(this));
    }

    /**
     * Determines if this attribute is somehow a date type.
     * This includes arrays of dates!
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is a date type else false
     * @memberof AttributeSchema
     */
    public isDateType(altType?: IAttrMetadata["type"]): boolean {
        const type = altType || this.type;
        return type.identifier === "Date" || this.checkSubTypes(type, this.isDateType.bind(this));
    }

    /**
     * Determines if this attribute is somehow a model type.
     * This includes arrays of models!
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is a model type else false
     * @memberof AttributeSchema
     */
    public isModelType(altType?: IAttrMetadata["type"]): boolean {
        const type = altType || this.type;
        return Boolean(type.isModel || this.checkSubTypes(type, this.isModelType.bind(this)));
    }

    /**
     * Determines if this attribute is an array type. This includes tuples!
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is an array type else false
     * @memberof AttributeSchema
     */
    public isArrayType(altType?: IAttrMetadata["type"]): boolean {
        const type = altType || this.type;
        return type.isArray || type.isTuple;
    }

    /**
     * Determines if this attribute is somehow an object type.
     * This includes arrays of objects and arrays itself as well as models!
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is a model type else false
     * @memberof AttributeSchema
     */
    public isObjectLikeType(altType?: IAttrMetadata["type"]): boolean {
        const type = altType || this.type;
        return type.isInterface || type.isIntersection || this.isModelType(type) || this.checkSubTypes(type, this.isObjectLikeType.bind(this));
    }

    /**
     * Determines if this attribute is somehow a plain object type.
     * This does **NOT** include arrays or models but arrays of plain objects!
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is a model type else false
     * @memberof AttributeSchema
     */
    public isPlainObjectType(altType?: IAttrMetadata["type"]): boolean {
        const type = altType || this.type;
        return Boolean(type.isInterface || this.checkSubTypes(type, this.isPlainObjectType.bind(this)));
    }

    /**
     * Determines if this attribute contains somehow an unresolved type.
     * This includes arrays of unresolved types too. An array of unresolved
     * types is given, if the array contains at least one unresolved type.
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is a model type else false
     * @memberof AttributeSchema
     */
    public isUnresolvedType(altType?: IAttrMetadata["type"]): boolean {
        const type = altType || this.type;
        return type.isMixed || type.isUnresolvedType || this.checkSubTypes(type, this.isUnresolvedType.bind(this));
    }

    /**
     * Returns the values of an union type when the type is a fully literal type
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns an empty array if is not a fully literal type and an array of strings or numbers else
     * @memberof AttributeSchema
     */
    public getUnionTypeValues(altType?: IAttrMetadata["type"]): (string | number)[] {
        const type = altType || this.type;
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
     * @memberof AttributeSchema
     */
    public getTypeIdentifier(altType?: IAttrMetadata["type"]) {
        const type = altType || this.type;
        if (this.isArrayType(type)) return type.subType.identifier;
        return type.identifier;
    }

    /**
     * Determines the relation type based on the type of both relation ends
     * and the relation column
     *
     * @returns null if no relation was found and the name corresponding to typeORMs relation names else
     * @memberof AttributeSchema
     */
    public async getRelationType() {
        if (!this.isModelType()) return null;
        const otherModel = await getModelClassByName(this.getTypeIdentifier());
        const otherAttributeSchema = otherModel && otherModel.getAttributeSchema(this.relationColumn as keyof ConstructionParams<InstanceType<typeof otherModel>>);

        if (!this.isArrayType()) {
            if (!this.relationColumn) return "OneToOne"; // owner is determined automatically
            if (otherAttributeSchema && otherAttributeSchema.isArrayType()) return "ManyToOne"; // owner not needed
        } else if (this.relationColumn) {
            if (otherAttributeSchema && !otherAttributeSchema.isArrayType()) return "OneToMany"; // owner not needed
            return "ManyToMany"; // owner has to be specified
        }
        return null;
    }

    /**
     * Determines the simple column type and its corresponding options.
     * Both has to be compatible with the corresponding database of the
     * environment.
     *
     * @protected
     * @param type the type of the attribute
     * @param defaultOptions default options determined in the buildSchema() method of this attribute
     * @returns an array with two elements. first is the type, second are the options
     * @memberof AttributeSchema
     */
    protected getColumnTypeNameAndOptions(type: IAttrMetadata["type"], defaultOptions: AllColumnOptions): [ColumnType, AllColumnOptions] {
        let typeName: ColumnType = "text";
        if (this.isArrayType(type)) {
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
        return [typeName, defaultOptions];
    }

    protected buildEmbeddedEntity(_attributeName: string, _type: IAttrMetadata["type"]): any {
        throw new Error("Not implemented!");
    }

    /**
     * Checks if sub type containing types are all of same type checked by the checkFunc
     *
     * @private
     * @param arrayLikeType type to check for same type sub types
     * @param checkFunc function that will be called to check the sub types
     * @returns true if all types are of type checked by checkFunc and false else
     * @memberof AttributeSchema
     */
    private checkSubTypes(arrayLikeType: IAttrMetadata["type"], checkFunc: ((type?: IAttrMetadata["type"]) => boolean)): boolean {
        if (this.isUnionType(arrayLikeType)) {
            return arrayLikeType.subTypes.every(checkFunc.bind(this));
        }

        if (this.isArrayType(arrayLikeType)) {
            if (arrayLikeType.isArray) {
                return Boolean(this.isUnionType(arrayLikeType.subType) && arrayLikeType.subType.subTypes.every(checkFunc.bind(this)) || arrayLikeType.subType.isModel);
            }
            return arrayLikeType.subTypes.every((subType) => {
                if (subType.isOptional) return checkFunc(subType.subType);
                return checkFunc(subType);
            });
        }

        return false;
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
        this.isIndex = Boolean(params.index);
        this.persistence = params.persistence ?? true;

        this.isGenerated = params.isGenerated;
        this.orphanedRowAction = params.orphanedRowAction ?? "delete";
        this.type = params.type;
        this.isRelationOwner = Boolean(params.isRelationOwner);
        this.relationColumn = params.relationColumn;

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
     * @private
     * @param type the type which should be used to build the schema
     * @memberof AttributeSchema
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
            let usedType: ColumnType | (() => Function) = typeName;
            if (embeddedEntity) usedType = () => embeddedEntity;
            console.debug(`Creating column ${this._ctor.name}#${attrName}: ${usedType} = ${JSON.stringify(options)}`);
            Column(<any>usedType, options)(proto, attrName);
        }

        if (this.isIndex) Index(this.indexOptions)(proto as any);
        this._constructed = true;
    }

    /**
     * Builds the relation when the attribute is somehow a model and takes
     * the relation column into account. It also determines the
     * relation column / relation table if possible.
     *
     * @private
     * @param attributeName the name of the attribute to find relation for
     * @param options options for the relation
     * @returns true if a relation was build and false else
     * @memberof AttributeSchema
     */
    private async buildRelation(attributeName: string, options: RelationOptions) {
        const proto = this._ctor.prototype;
        const otherModel = await getModelClassByName(this.getTypeIdentifier());
        if (!otherModel) return false;

        const typeFunc = () => otherModel;
        // eslint-disable-next-line
        const inverseFunc = (instance: InstanceType<ReturnType<typeof typeFunc>>) => Reflect.get(instance, this.relationColumn!);

        let inverse = undefined;
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
}
