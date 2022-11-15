import type { AttrOptionsPartialMetadataJson } from "~env/@types/AttributeSchema";
import type { ModelLike, ActionDefinition } from "~env/@types/ModelClass";
import type AttributeSchema from "~env/lib/AttributeSchema";
import type BaseAttribute from "~env/lib/BaseAttribute";
import type ModelSchema from "~env/lib/ModelSchema";

/**
 * This is a singleton store which hold all reflect-metadata data to be type
 * safe and to have control over assigning and accessing metadata.
 * It also updates existing metadata and extends it if necessary.
 */
export default class MetadataStore {

    /**
     * Because this is a singleton we need to store the instance
     */
    private static instance: MetadataStore;

    /**
     * Holds all attribute schemas which were created on construction time
     */
    private attributeSchemas: Record<string, AttributeSchema<any>[]> = {};

    /**
     * Hold all model schemas which were creates on construction time
     */
    private modelSchemas: Record<string, ModelSchema<any>> = {};

    /**
     * Holds for each model the corresponding attribute schemas.
     * This has to be a WeakMap to avoid memory leaks when a model is destroyed.
     */
    private attributes: WeakMap<InstanceType<ModelLike>, Record<string, BaseAttribute<any>>> = new WeakMap();

    public constructor() {
        if (MetadataStore.instance) return MetadataStore.instance;
        MetadataStore.instance = this;
        return this;
    }

    /**
     * Stores the given attribute schema with corresponding name on the given target
     *
     * @param target the static class where the schema has to be saved on
     * @param attributeName the name of the schema
     * @param schema the schema itself
     */
    public setAttributeSchema<T extends ModelLike>(target: T, attributeName: keyof T, schema: AttributeSchema<T>) {
        const attrStr = attributeName.toString();
        if (!this.attributeSchemas[attrStr]) {
            this.attributeSchemas[attrStr] = [schema];
        } else this.attributeSchemas[attrStr].push(schema);
        Reflect.defineMetadata(`${target.name}:${String(attributeName)}:definition`, schema, target);
    }

    /**
     * Searches for the given attribute schema by its name on the given static class
     *
     * @param target the static class to get the schema from
     * @param attributeName the name of the schema
     * @returns the attribute schema if found and null else
     */
    public getAttributeSchema<T extends ModelLike>(target: T, attributeName: keyof T): AttributeSchema<T> | null {
        return Reflect.getMetadata(`${target.name}:${String(attributeName)}:definition`, target) || null;
    }

    /**
     * Searches for all attribute schemas on the given target and returns them as a plain object
     *
     * @param target the static class to get schemas from
     * @returns a plain object with attribute schemas names as key and the schemas as values
     */
    public getAttributeSchemas<T extends ModelLike>(target: T): AttributeSchema<T>[] {
        const attributeSchemas: Record<string, AttributeSchema<T>> = {};
        const metadataKeys: string[] = Reflect.getMetadataKeys(target).slice().reverse();
        for (const key of metadataKeys) {
            const attributeName = key.split(":")[1];
            if (key.endsWith("definition")) attributeSchemas[attributeName] = Reflect.getMetadata(key, target);
        }
        return Object.values(attributeSchemas);
    }

    /**
     * Searches for corresponding attribute schema, collects its parameters and
     * merges them into new parameters object which then will be extended by
     * the new parameters.
     *
     * @param attributeName name of the attribute schema
     * @param params params to merge into
     * @returns new attribute parameters
     */
    public constructAttributeSchemaParams<T extends ModelLike>(attributeName: keyof T, params: AttrOptionsPartialMetadataJson<T>) {
        const newParams = {};
        this.attributeSchemas[attributeName.toString()]?.forEach((attributeSchema) => {
            Object.assign(newParams, attributeSchema.parameters);
        });
        Object.assign(newParams, params);
        return <AttrOptionsPartialMetadataJson<T>>newParams;
    }

    /**
     * Stores the given model schema on the given static model class with the given name
     *
     * @param target the static model class to store the schema on
     * @param schemaName the name of the schema
     * @param schema the schema itself
     */
    public setModelSchema<T extends ModelLike>(target: T, schemaName: string, schema: ModelSchema<T>) {
        this.modelSchemas[schemaName] = schema;
        Reflect.defineMetadata(`${target.constructor.name}:schema`, schema, target);
    }

    /**
     * Searches for the model schema by its name on the given static model class
     *
     * @param target the static model class to get the schema from
     * @param schemaName the name of the schema
     * @returns the schema of the model if found and null else
     */
    public getModelSchema<T extends ModelLike>(target?: T, schemaName?: string): ModelSchema<T> | null {
        if (schemaName && this.modelSchemas[schemaName]) return this.modelSchemas[schemaName];
        if (target) return Reflect.getMetadata(`${target.constructor.name}:schema`, target) || null;
        return null;
    }

    /**
     * Stores the given attribute in the attributes object with given name and
     * given model instance.
     *
     * @param target the static model class to store the attribute on
     * @param attributeName the name of the attribute
     * @param attribute the attribute itself
     */
    public setAttribute<T extends ModelLike>(target: InstanceType<T>, attributeName: string, attribute: BaseAttribute<T>) {
        if (!this.attributes.has(target)) this.attributes.set(target, {});
        const attributes = this.attributes.get(target);
        if (attributes) Reflect.set(attributes, attributeName, attribute);
    }

    /**
     * Returns the attribute by its name and model instance from the attributes object.
     *
     * @param target the model instance to get the attribute from
     * @param attributeName the name of the attribute
     * @returns the attribute if found and undefined else
     */
    public getAttribute<T extends ModelLike>(target: InstanceType<T>, attributeName: string): BaseAttribute<T> | undefined {
        return this.attributes.get(target)?.[attributeName];
    }

    /**
     * Returns all available attributes of the given model
     *
     * @param target the model instance to get the attributes from
     * @returns all attributes of the given model
     */
    public getAttributes<T extends ModelLike>(target: InstanceType<T>): BaseAttribute<T>[] {
        return Object.values(this.attributes.get(target) ?? {});
    }

    /**
     * Registers an action on the target which will also be accessible for sub classed.
     *
     * @param target the model instance or class to get the attribute from
     * @param methodName the name of the method
     * @param action the definition of the action
     */
    public setAction<T extends ModelLike>(target: InstanceType<T>, methodName: string, action: ActionDefinition) {
        Reflect.defineMetadata(`action:method:${methodName}`, action, target);
        Reflect.defineMetadata(`action:action:${action.params.name}`, action, target);
    }

    /**
     * Searches for registered action by name and returns it
     *
     * @param target the model instance or class to get the attribute from
     * @param methodOrActionName the name of the method OR of the action
     * @returns the registered action with corresponding name if exists
     */
    public getAction<T extends ModelLike>(target: InstanceType<T>, methodOrActionName: string): ActionDefinition | null {
        const byMethodName = Reflect.getMetadata(`action:method:${methodOrActionName}`, target);
        const byActionName = Reflect.getMetadata(`action:action:${methodOrActionName}`, target);
        return byActionName || byMethodName || null;
    }
}
