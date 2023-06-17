
import { merge } from "~env/utils/utils";
import type { ValidationResult } from "~env/@types/Errors";
import type { MetadataType } from "~env/@types/MetadataTypes";
import type { Type } from "~env/utils/schema";


/**
 * Implements basic functionality for schema validation and defines necessary
 * methods as a contract for subclasses. The schema type might be constructed
 * asynchronously which is the reason for the existence of the method awaitConstruction.
 * Make sure to await its result on every construction.
 *
 * @template T The model where the schema of the model belongs to
 */
export default abstract class Schema<T> {

    /**
     * The name of the attribute in the schema. Corresponds to the attribute
     * name in the class (maybe not in runtime)
     */
    public readonly name: string | keyof T;

    public readonly internalName: string;

    /**
    * The options which initializes the schema
    */
    public readonly options: Record<string, any> = {};

    /**
     * Internal state which determines if the schema is fully built or not.
     * NOTE: This will be set to true if the schema is fully built
     * (including relation).
     */
    protected _constructed: boolean = false;

    /**
     * Holds the class object which created the schema.
     */
    public abstract readonly owner?: T;

    /**
     * Holds the "ready to validate" schema of the type
     */
    protected abstract schemaType: Type<any> | null;

    public constructor(name: string | keyof T, internalName: string, options: Record<string, any>) {
        this.name = name;
        this.internalName = internalName;
        this.options = options;
    }

    /**
     * Returns a promise which resolves when the schema was built the first time.
     * Useful to ensure the correct order of decorator execution during setup.
     *
     * @returns a resolving promise
     */
    public awaitConstruction() {
        return new Promise<boolean>((resolve) => {
            const interval = setInterval(() => {
                if (!this._constructed) return;
                clearInterval(interval);
                resolve(true);
            });
        });
    }

    /**
     * updates the options and rebuilds constraints and schema depending
     * on new options
     *
     * @param options options of this attribute
     */
    public updateOptions(options: Record<string, any>) {
        merge(this.options, options);
    }

    /**
     * This maybe creates the schema type and caches it or just returns an already
     * created schema type.
     *
     * @returns the schema type which will be used by the attribute schemas to
     * provide a type based schema type them self.
     */
    public abstract getSchemaType(): Type;

    /**
     * This validates the given value against the generated schema type.
     *
     * @param value Any value to validate
     * @returns A validation result which contains success state and multiple errors
     */
    public abstract validate(value: unknown): Promise<ValidationResult>;

    /**
     * Generates a schema which will be used to validate a value. This schema is
     * a pure data schema and depends completely on the attributes type.
     * This also takes isRequired and other constraints into account.
     *
     * @param type type to build schema from
     * @param [applySettings = true] wether to apply settings like min, max and so on
     * @returns at least a "ZodAnyType"
     */
    protected abstract buildSchemaType(type: MetadataType, applySettings?: boolean): Type;
}
