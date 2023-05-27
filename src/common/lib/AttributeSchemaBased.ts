import ActionableSchemaBased from "~env/lib/ActionableSchemaBased";
import MetadataStore from "~env/lib/MetadataStore";
import type AttributeSchema from "~env/lib/AttributeSchema";
import type EnvAttributeSchemaBased from "~env/lib/AttributeSchemaBased";

const metadataStore = new MetadataStore();

export default abstract class AttributeSchemaBased extends ActionableSchemaBased {

    public constructor(params?: Record<string, any>) {
        super(params);
    }

    /**
     * Looks for the attribute given by the name and returns its schema
     *
     * @param name the name of the attribute
     * @returns the schema of the attribute given by name
     */
    public static getAttributeSchema<TThis extends typeof EnvAttributeSchemaBased>(this: TThis, name: string): AttributeSchema<any> | null {
        if (!("className" in this) || typeof this.className !== "string") return null;
        return this.getSchema("Model", this.className)?.getAttributeSchema(name) || null;
    }

    /**
     * @see AttributeSchemaBased.getAttributeSchema
     */
    public getAttributeSchema<TThis extends EnvAttributeSchemaBased>(this: TThis, name: string): AttributeSchema<any> | null {
        return (this.constructor as typeof AttributeSchemaBased).getAttributeSchema(name) || null;
    }

    /**
     * returns the attributes instance identified by the current schema based
     * instance and the given name.
     *
     * @param name the name of the attribute
     * @returns the unique initialized attribute owned by this schema based instance and identified by the given name
     */
    public getAttribute<TThis extends EnvAttributeSchemaBased>(this: TThis, name: string) {
        return metadataStore.getInstance("Attribute", this, name) || null;
    }

    /**
     * collects all attributes of this schema based instance and returns them.
     *
     * @returns array of all attributes
     */
    public getAttributes<TThis extends EnvAttributeSchemaBased>(this: TThis) {
        return metadataStore.getInstances("Attribute", this);
    }
}
