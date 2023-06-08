import * as DataTypes from "~env/lib/DataTypes";
import Logger from "~env/lib/Logger";
import Schema from "~env/lib/Schema";
import { baseTypeFuncs, LazyType, NumberType, StringType, UnionType, toInternalValidationReturnType, getModelNameToModelMap } from "~env/utils/schema";
import { isArray } from "~env/utils/utils";
import type { DeepTypedOptions, DeepTypedOptionsPartialMetadataJson, SchemaTypes, ObjectSchemaType } from "~env/@types/DeepTypedSchema";
import type { ValidationResult } from "~env/@types/Errors";
import type {
    MetadataType,
    CombinedDataType,
    IPrimitiveType,
    IMixedType,
    IArrayType,
    ICustomType,
    IIdentifiedType,
    IInterfaceType,
    IIntersectionType,
    ILiteralType,
    IModelType,
    IOptionalType,
    ITupleType,
    IUnionType,
    IUnresolvedType,
    INamedObject,
    IObjectType,
    IRecordType
} from "~env/@types/MetadataTypes";
import type { TypeError } from "~env/lib/Errors";
import type SchemaBased from "~env/lib/SchemaBased";
import type { ObjectType } from "~env/utils/schema";

const logger = new Logger("schema");

/**
 * Provides basic functionality for schemas with nested Types and constraints
 * like "isRequires", "min" or "max". Owner and raw type might be set after
 * construction because usually this schemas belong to a model which might be
 * still under construction after this schema is constructed. So make sure to
 * call the methods "setOwner" and "awaitConstruction".
 *
 * @template T The model where the schema of the model belongs to
 */
export default abstract class DeepTypedSchema<T extends typeof SchemaBased> extends Schema<T> implements DeepTypedOptions<T> {

    /**
     * Holds the class object which created the schema. This is only a valid
     * value after processing the schema of the class!
     */
    public readonly owner?: T;

    /**
    * The options which initializes the schema
    */
    declare public readonly options: Readonly<DeepTypedOptionsPartialMetadataJson<T>>;

    /**
     * Indicates if an attribute has to be set manually (does not have a default)
     */
    public isRequired: boolean = false;

    /**
     * Indicates if an attribute should only be loaded from database when it
     * is explicitly used. This is always the case when the type of the
     * attribute is a Promise
     */
    public isLazy: boolean = false;

    /**
     * Indicates if an attribute should always be loaded from database when the
     * entity is loaded.
     */
    public isEager: boolean = false;

    /**
     * @InheritDoc
     */
    public primary?: DeepTypedOptions<T>["primary"];

    /**
     * @InheritDoc
     */
    public min?: number;

    /**
     * @InheritDoc
     */
    public max?: number;

    /**
     * @InheritDoc
     */
    public multipleOf?: number;

    /**
     * @InheritDoc
     */
    public validator?: keyof typeof DataTypes;

    /**
     * The type which was determined during compile time
     */
    protected rawType!: MetadataType;

    /**
     * @InheritDoc
     */
    protected schemaType: SchemaTypes | null = null;

    /**
     * This is the original class type which is used while construction.
     * Use this.owner during runtime, which is the evaluated version of this one
     */
    protected readonly _ctor: T;

    public constructor(ctor: T, name: string | keyof T, internalName: string, options: DeepTypedOptionsPartialMetadataJson<T>) {
        super(name, internalName, options);
        this._ctor = ctor;
    }

    /**
     * Sets the model class for later use to be able to navigate through the models
     *
     * @param owner the class of the model to set
     */
    public setOwner(owner: T) {
        if (this.owner) return;
        // @ts-expect-error this is needed to be able to provide the ctor at runtime after construction
        this.owner = owner;
    }

    /**
     * Determines a flat version of the type identifier. The max depth is 1
     *
     * @param [altType] alternative type to get identifier from
     * @returns the name of the identifier if exists
     */
    public getTypeIdentifier(altType?: MetadataType): string | undefined {
        const type = altType || this.rawType;
        if (this.isTupleType(type)) return type.subTypes.find(this.hasIdentifier.bind(this))?.identifier;
        if (this.isArrayType(type) && !this.isTupleType(type) && this.hasIdentifier(type.subType)) return type.subType.identifier;
        if (this.hasIdentifier(type)) return type.identifier;
    }

    /**
     * Determines if this attribute is somehow a union type.
     * This does **NOT** include arrays of unions!
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is a union type else false
     */
    public isUnionType(altType?: MetadataType): altType is IUnionType {
        const type = altType || this.rawType;
        return Boolean("isObjectType" in type && "isUnion" in type && type.isUnion);
    }

    /**
     * Determines if this attribute is somehow a intersection type.
     * This does **NOT** include arrays of intersections!
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is a intersection type else false
     */
    public isIntersectionType(altType?: MetadataType): altType is IIntersectionType {
        const type = altType || this.rawType;
        return Boolean("isObjectType" in type && "isIntersection" in type && type.isIntersection);
    }

    /**
     * Determines if this attribute is somehow a literal type.
     * This includes unions of literals!
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is a literal type else false
     */
    public isLiteralType(altType?: MetadataType): altType is CombinedDataType<ILiteralType> {
        const type = altType || this.rawType;
        return "isPrimitive" in type && "isLiteral" in type && type.isLiteral || this.checkSubTypes(type, this.isLiteralType.bind(this));
    }

    /**
     * Determines if this attribute is somehow a string type.
     * This includes unions of strings!
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is a string type else false
     */
    public isStringType(altType?: MetadataType): altType is CombinedDataType<IPrimitiveType<"String"> | ILiteralType<string, "String">> {
        const type = altType || this.rawType;
        return "isPrimitive" in type && type.isPrimitive && type.identifier === "String" || this.checkSubTypes(type, this.isStringType.bind(this));
    }

    /**
     * Determines if this attribute is somehow a number type.
     * This includes unions of numbers!
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is a number type else false
     */
    public isNumberType(altType?: MetadataType): altType is CombinedDataType<IPrimitiveType<"Number"> | ILiteralType<number, "Number">> {
        const type = altType || this.rawType;
        return "isPrimitive" in type && type.identifier === "Number" || this.checkSubTypes(type, this.isNumberType.bind(this));
    }

    /**
     * Determines if this attribute is somehow a boolean type.
     * This includes unions of booleans!
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is a boolean type else false
     */
    public isBooleanType(altType?: MetadataType): altType is CombinedDataType<IPrimitiveType<"Boolean"> | ILiteralType<boolean, "Boolean">> {
        const type = altType || this.rawType;
        return "isPrimitive" in type && type.identifier === "Boolean" || this.checkSubTypes(type, this.isBooleanType.bind(this));
    }

    /**
     * Determines if this attribute is somehow a date type.
     * This includes unions of dates!
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is a date type else false
     */
    public isDateType(altType?: MetadataType): altType is CombinedDataType<INamedObject<"Date">> {
        const type = altType || this.rawType;
        return "isObjectType" in type && "isNamedObject" in type && type.identifier === "Date" || this.checkSubTypes(type, this.isDateType.bind(this));
    }

    /**
     * Determines if this attribute is somehow a model type.
     * This includes unions of models!
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is a model type else false
     */
    public isModelType(altType?: MetadataType): altType is CombinedDataType<IModelType> {
        const type = altType || this.rawType;
        return Boolean("isObjectType" in type && "isModel" in type && type.isModel || this.checkSubTypes(type, this.isModelType.bind(this)));
    }

    /**
     * Determines if this attribute is an array type. This does NOT include tuples
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is an array type else false
     */
    public isArrayType(altType?: MetadataType): altType is IArrayType | ITupleType {
        const type = altType || this.rawType;
        return "isObjectType" in type && "isArray" in type && type.isArray;
    }

    /**
     * Determines if this attribute is a tuple type. This does NOT include
     * regular arrays.
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is a tuple type else false
     */
    public isTupleType(altType?: MetadataType): altType is ITupleType {
        const type = altType || this.rawType;
        return "isObjectType" in type && "isTuple" in type && type.isTuple;
    }

    /**
     * Determines if this attribute has an optional type
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is an optional type else false
     */
    public isOptionalType(altType?: MetadataType): altType is IOptionalType {
        const type = altType || this.rawType;
        return "isOptional" in type && type.isOptional;
    }

    /**
     * Determines if the type of the attribute is an identifies type (means a
     * type with an explicit name).
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is an identified type else false
     */
    public hasIdentifier(altType?: MetadataType): altType is IIdentifiedType<string> {
        const type = altType || this.rawType;
        return Boolean("identifier" in type && type.identifier);
    }

    /**
     * Determines if this attribute is somehow an object type.
     * This includes unions of objects and arrays itself as well as models!
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is a model type else false
     */
    public isObjectLikeType(altType?: MetadataType): altType is IObjectType {
        const type = altType || this.rawType;
        return "isObjectType" in type && type.isObjectType || this.checkSubTypes(type, this.isObjectLikeType.bind(this), true);
    }

    /**
     * Determines if this attribute is somehow a plain object type.
     * This does **NOT** include arrays or models!
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is a model type else false
     */
    public isPlainObjectType(altType?: MetadataType): altType is IInterfaceType {
        const type = altType || this.rawType;
        return Boolean("isObjectType" in type && ("isInterface" in type && type.isInterface || "isIntersection" in type && type.isIntersection) || this.checkSubTypes(type, this.isPlainObjectType.bind(this), true));
    }

    /**
     * Determines if this attribute is an record type. This does NOT include index signatures
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is an record type else false
     */
    public isRecordType(altType?: MetadataType): altType is IRecordType {
        const type = altType || this.rawType;
        return Boolean("isObjectType" in type && "isRecord" in type && type.isObjectType && type.isRecord);
    }

    /**
     * Determines if this attribute contains somehow an unresolved type.
     * This includes unions of unresolved types too.
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is an unresolved type else false
     */
    public isUnresolvedType(altType?: MetadataType): altType is CombinedDataType<IMixedType | IUnresolvedType> {
        const type = altType || this.rawType;
        return "isUnresolved" in type && type.isUnresolved || this.checkSubTypes(type, this.isUnresolvedType.bind(this));
    }

    /**
     * Determines if this attribute contains an any type.
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is an any type else false
     */
    public isAnyType(altType?: MetadataType): altType is CombinedDataType<IMixedType | IUnresolvedType> {
        const type = altType || this.rawType;
        return "isMixed" in type && type.isMixed && "isUnresolved" in type && !type.isUnresolved;
    }

    /**
     * Determines if the type of this attribute is undefined
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is an undefined type else false
     */
    public isUndefinedType(altType?: MetadataType): altType is IPrimitiveType<"Undefined"> {
        const type = altType || this.rawType;
        return "isPrimitive" in type && type.identifier === "Undefined";
    }

    /**
     * Determines if the type of this attribute is null
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is a null type else false
     */
    public isNullType(altType?: MetadataType): altType is IPrimitiveType<"Null"> {
        const type = altType || this.rawType;
        return "isPrimitive" in type && type.identifier === "Null";
    }

    /**
     * Determines if the type of this attribute is a custom defined type.
     * This type looks like an identified type but behaves different in
     * determination of database type name and schema type generation.
     *
     * @param [altType] A type which should be checked if not given the internal type is used
     * @returns true if it is a custom type else false
     */
    public isCustomType(altType?: MetadataType): altType is ICustomType {
        const type = altType || this.rawType;
        return "isCustomType" in type && type.isCustomType;
    }

    /**
     * Checks if sub type containing types are all of same type checked by the checkFunc
     *
     * @param arrayLikeType type to check for same type sub types
     * @param checkFunc function that will be called to check the sub types
     * @returns true if all types are of type checked by checkFunc and false else
     */
    protected checkSubTypes(arrayLikeType: MetadataType, checkFunc: ((type?: MetadataType) => boolean), includeIntersections: boolean = false): boolean {
        let intersectionResult = false;
        let unionResult = false;
        let arrayResult = false;
        if (includeIntersections && this.isIntersectionType(arrayLikeType)) intersectionResult = arrayLikeType.subTypes.every(checkFunc.bind(this));
        if (this.isUnionType(arrayLikeType)) unionResult = arrayLikeType.subTypes.every(checkFunc.bind(this));
        if (this.isArrayType(arrayLikeType) && !this.isTupleType(arrayLikeType)) arrayResult = checkFunc(arrayLikeType.subType);
        return unionResult || intersectionResult || arrayResult;
    }

    /**
     * Sets all given constraints on this schema and decides which behavior
     * (lazy or eager) will be applied and so on.
     *
     * @param options an object with constraints to set on this attribute schema
     */
    protected setConstants(options: DeepTypedOptionsPartialMetadataJson<T>) {
        this.rawType = options.type;

        this.isRequired = Boolean(options.isRequired);
        this.isLazy = Boolean(options.isLazy);
        this.isEager = Boolean(options.isEager);
        this.primary = Boolean(options.primary);

        this.min = options.min;
        this.max = options.max;
        this.multipleOf = options.multipleOf;
        this.validator = options.validator;
    }

    /**
     * @see Schema.validate
     */
    protected internalValidation(value: unknown, errorClass: typeof TypeError): ValidationResult {
        const name = this.name.toString();

        const rawType = this.options.type;
        if (isArray(value) && this.isTupleType(rawType)) {
            const length = rawType.subTypes.length;
            const min = rawType.subTypes.findIndex((subType) => this.isOptionalType(subType));
            if (value.length < min) return { success: false, errors: [new errorClass(name, "rangeUnderflow", [], value)] };
            if (value.length > length) return { success: false, errors: [new errorClass(name, "rangeOverflow", [], value)] };
            value = value.slice();
            (value as any[]).length = length;
        }

        let result: ValidationResult;
        // eslint-disable-next-line import/namespace
        const DataType = this.validator && DataTypes[this.validator];
        if (DataType) {
            result = DataType({ min: this.min, max: this.max, name: this.getTypeIdentifier(), getAttribute: () => this as any }).validate(value);
        } else result = toInternalValidationReturnType(String(this.name), value, this.getSchemaType().safeParse(value), errorClass);

        return result;
    }

    /**
     * NOTE: This assumes that all models are already loaded to have access
     * to the MODEL_NAME_TO_MODEL_MAP which allows to be sync which is needed
     * for circular schema definitions.
     *
     * @InheritDoc
     */
    protected buildSchemaType(type: MetadataType, applySettings = true): SchemaTypes {
        let schemaType: SchemaTypes = baseTypeFuncs.never();

        // eslint-disable-next-line import/namespace
        if (this.validator && DataTypes[this.validator]) {
            // eslint-disable-next-line import/namespace
            schemaType = DataTypes[this.validator]({ min: this.min, max: this.max }).schemaType;
        } else if (this.isTupleType(type)) {
            const tupleTypes = type.subTypes.map((subType) => this.buildSchemaType(subType, false));
            schemaType = baseTypeFuncs.tuple(tupleTypes as [SchemaTypes, ...SchemaTypes[]]);
        } else if (this.isArrayType(type) && !this.isTupleType(type)) {
            schemaType = baseTypeFuncs.array(this.buildSchemaType(type.subType, false));
        } else if (this.isOptionalType(type)) {
            schemaType = baseTypeFuncs.optional(this.buildSchemaType(type.subType, false));
        } else if (this.isModelType(type)) {
            const typeIdentifier = this.getTypeIdentifier(type) || "";
            const modelClass = getModelNameToModelMap(typeIdentifier);
            const modelSchema = modelClass?.getSchema();
            schemaType = modelSchema?.getSchemaType()?.or(baseTypeFuncs.instanceof(modelClass as any)) || baseTypeFuncs.never();
        } else if (this.isIntersectionType(type) || this.isUnionType(type)) {
            const subTypes = type.subTypes.slice();
            schemaType = this.buildSchemaType(subTypes.shift() as MetadataType, false);
            for (const subType of subTypes) {
                let subSchemaType = this.buildSchemaType(subType, false) as ObjectType<any>;
                if (this.isIntersectionType(type)) {
                    if (subSchemaType instanceof UnionType) subSchemaType = subSchemaType.options[0];
                    if (subSchemaType instanceof LazyType) subSchemaType = subSchemaType.schema;
                    if (schemaType instanceof UnionType) schemaType = schemaType.options[0];
                    if (schemaType instanceof LazyType) {
                        schemaType = baseTypeFuncs.object(Object.assign({}, schemaType.schema.shape, subSchemaType.shape));
                    } else schemaType = Object.assign({}, (schemaType as ObjectType<any>).shape, subSchemaType.shape);
                } else schemaType = schemaType.or(subSchemaType);
            }
        } else if (this.isDateType()) {
            schemaType = baseTypeFuncs.date().or(baseTypeFuncs.string().datetime());
        } else if (this.isRecordType(type)) {
            schemaType = baseTypeFuncs.record(this.buildSchemaType(type.typeArguments[1], false));
        } else if (this.isPlainObjectType(type)) {
            schemaType = this.buildPlainObjectSchemaType(type, applySettings);
        } else if (this.isNullType(type)) {
            schemaType = baseTypeFuncs.null();
        } else if (this.isUndefinedType(type)) {
            schemaType = baseTypeFuncs.undefined();
        } else if (this.isLiteralType(type) && "value" in type && typeof type.value !== "symbol") {
            // "Value" has to be in type because a literal can obviously be an union type
            schemaType = baseTypeFuncs.literal(type.value);
        } else if (this.isStringType(type)) {
            schemaType = baseTypeFuncs.string();
        } else if (this.isNumberType(type)) {
            schemaType = baseTypeFuncs.number();
        } else if (this.isBooleanType(type)) {
            schemaType = baseTypeFuncs.boolean();
        } else if (this.isAnyType(type)) schemaType = baseTypeFuncs.any();

        if (applySettings) {
            let min = -Infinity;
            if (this.isStringType(type)) min = 0;
            if (this.min !== undefined) min = this.min;
            if (schemaType instanceof NumberType) {
                schemaType.gte(min);
            } else if (schemaType instanceof StringType) schemaType.min(min);

            let max = Infinity;
            if (this.max !== undefined) max = this.max;
            if (schemaType instanceof NumberType) {
                schemaType.lte(max);
            } else if (schemaType instanceof StringType) schemaType.max(max);

            if (!this.isRequired) schemaType = baseTypeFuncs.optional(schemaType);
            if (this.isLazy) schemaType = schemaType.or(baseTypeFuncs.promise(schemaType));
        }

        logger.debug(`Created schema type ${this._ctor.name}#${String(this.name)}: ${schemaType._def.typeName}`);
        return schemaType;
    }

    /**
     * Creates a schema for a plain object or never based on the given raw type
     *
     * @param type The raw type of the current schema or current deep type
     * @param applySettings wether to apply settings like min, max and so on
     */
    protected abstract buildPlainObjectSchemaType(type: IInterfaceType, applySettings: boolean): ObjectSchemaType;
}
