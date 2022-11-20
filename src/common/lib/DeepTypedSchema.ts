import type { DeepTypedOptions, DeepTypedOptionsPartialMetadataJson } from "~env/@types/DeepTypedSchema";
import type { MetadataType } from "~env/@types/MetadataTypes";
import type { ModelLike } from "~env/@types/ModelClass";
import type * as DataTypes from "~env/lib/DataTypes";

export default abstract class DeepTypedSchema<T extends ModelLike> implements DeepTypedOptions<T> {

    /**
     * Holds the class object which created the schema. This is only a valid
     * value after processing the schema of the class!
     */
    public readonly owner?: T;

    /**
     * The name of the attribute in the schema. Corresponds to the attribute
     * name in the class (maybe not in runtime)
     */
    public readonly name: string | keyof T;

    /**
    * The options which initializes the schema
    */
    public readonly options: Readonly<DeepTypedOptionsPartialMetadataJson<T>> = {} as Readonly<DeepTypedOptionsPartialMetadataJson<T>>;

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
     * @inheritdoc
     */
    public primary?: DeepTypedOptions<T>["primary"];

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
     * The type which was determined during compile time
     */
    protected rawType!: MetadataType;

    /**
     * This is the original class type which is used while construction.
     * Use this.owner during runtime, which is the evaluated version of this one
     */
    protected readonly _ctor: T;

    public constructor(ctor: T, name: string | keyof T, options: DeepTypedOptionsPartialMetadataJson<T>) {
        this._ctor = ctor;
        this.name = name;
        this.options = options;
    }

    /**
     * Sets all given constraints on thi schema and decides which behavior
     * (lazy or eager) will be applied and wether this attribute will cascade
     * or not.
     *
     * @param params an object with constraints to set on this attribute schema
     */
    protected setConstants(params: DeepTypedOptionsPartialMetadataJson<T>) {
        this.rawType = params.type;

        this.isRequired = Boolean(params.isRequired);
        this.isLazy = Boolean(params.isLazy);
        this.primary = Boolean(params.primary);

        this.min = params.min;
        this.max = params.max;
        this.multipleOf = params.multipleOf;
        this.validator = params.validator;
    }
}
