import MetadataStore from "~env/lib/MetadataStore";
import type EnvSchemaBased from "~env/lib/SchemaBased";

const metadataStore = new MetadataStore();

export default abstract class SchemaBased {

    /**
     * This gives access to the instance or class without proxy around.
     * This enables to make changes without generating changes on the model for
     * example and also gives the ability to improve performance.
     */
    public static readonly unProxyfiedObject: typeof SchemaBased;

    /**
     * Provides the possibility to check if a value is a schema based object.
     * HINT: This is mainly provided to avoid import loops. You should prefer
     * the usual instanceof check if possible.
     */
    public readonly isSchemaBased: boolean = true;

    /**
     * @see SchemaBased.unProxyfiedObject
     */
    public abstract unProxyfiedObject: this;

    public constructor(_params?: Record<string, any>) {
        // Nothing to do here. This is just an interface to match the type
    }

    /**
     * Looks for the schema of the current instance and returns it
     *
     * @returns the schema of the model
     */
    public static getSchema<TType extends "Model" | "Route">(type: TType, name: string) {
        return metadataStore.getSchema(type, Object.getPrototypeOf(this), name);
    }

    /**
     * @see SchemaBased.getSchema
     */
    public getSchema<TType extends "Model" | "Route">(type: TType, name: string) {
        return (this.constructor as typeof EnvSchemaBased).getSchema(type, name);
    }
}
