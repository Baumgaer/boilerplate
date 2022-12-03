import type { StringKeyOf, ValueOf } from "type-fest";
import type { ActionDefinition, ActionOptionsPartialMetadataJson } from "~env/@types/ActionSchema";
import type { ArgOptionsPartialMetadataJson } from "~env/@types/ArgumentSchema";
import type { AttrOptionsPartialMetadataJson } from "~env/@types/AttributeSchema";
import type { ModelLike, ModelOptionsPartialMetadataJson } from "~env/@types/ModelClass";
import type ActionSchema from "~env/lib/ActionSchema";
import type ArgumentSchema from "~env/lib/ArgumentSchema";
import type AttributeSchema from "~env/lib/AttributeSchema";
import type BaseAttribute from "~env/lib/BaseAttribute";
import type ModelSchema from "~env/lib/ModelSchema";

interface TypeNameTypeMap<T extends ModelLike> {
    Model: {
        schema: ModelSchema<T>
        options: ModelOptionsPartialMetadataJson<T>
    }
    Attribute: {
        schema: AttributeSchema<T>
        options: AttrOptionsPartialMetadataJson<T>
    }
    Argument: {
        schema: ArgumentSchema<T>
        options: ArgOptionsPartialMetadataJson<T>
    }
    Action: {
        schema: ActionSchema<T>
        options: ActionOptionsPartialMetadataJson<T>
    }
}

type SchemaTypeNames<T extends ModelLike> = StringKeyOf<TypeNameTypeMap<T>>;
type SchemaTypes<T extends ModelLike> = ValueOf<TypeNameTypeMap<T>>["schema"];
type SchemasType<T extends ModelLike> = Record<SchemaTypeNames<T>, Record<string, any[]>>;

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
     * Holds for each model the corresponding attribute schemas.
     * This has to be a WeakMap to avoid memory leaks when a model is destroyed.
     */
    private attributes: WeakMap<InstanceType<ModelLike>, Record<string, BaseAttribute<any>>> = new WeakMap();

    private schemas?: SchemasType<ModelLike>;

    public constructor() {
        if (MetadataStore.instance) return MetadataStore.instance;
        // @ts-expect-error test
        window.metadataStore = this;
        MetadataStore.instance = this;
        return this;
    }

    public setSchema<T extends ModelLike, N extends SchemaTypeNames<T>>(type: N, target: T, name: keyof T, schema: SchemaTypes<T>) {
        const schemaName = name.toString();

        if (!this.schemas) this.schemas = {} as SchemasType<T>;
        if (!this.schemas[type]) Reflect.set(this.schemas, type, {});
        if (!this.schemas[type][schemaName]) Reflect.set(this.schemas[type], schemaName, []);

        this.schemas[type]?.[schemaName].push(schema);
        Reflect.defineMetadata(`${target.name}:${schemaName}:${type}Definition`, schema, target);
    }

    public getSchema<T extends ModelLike, N extends SchemaTypeNames<T>>(type: N, target: T, name: keyof T): TypeNameTypeMap<T>[N]["schema"] | null {
        if (this.schemas?.[type]?.[String(name)]?.at(-1)) return this.schemas?.[type]?.[String(name)].at(-1);
        return Reflect.getMetadata(`${target.name}:${String(name)}:${type}Definition`, target);
    }

    public getSchemas<T extends ModelLike, N extends SchemaTypeNames<T>>(type: N, target: T): TypeNameTypeMap<T>[N]["schema"][] {
        const schemas: Record<string, any> = {};
        const metadataKeys: string[] = Reflect.getMetadataKeys(target).slice().reverse();
        for (const key of metadataKeys) {
            const [_targetName, schemaName, typeDefinitionName] = key.split(":");
            if (typeDefinitionName === `${type}Definition`) schemas[schemaName] = Reflect.getMetadata(key, target);
        }
        return Object.values(schemas);
    }

    public constructSchemaParams<T extends ModelLike, N extends SchemaTypeNames<T>>(type: N, name: keyof T, options: TypeNameTypeMap<T>[N]["options"]) {
        const newParams = {} as TypeNameTypeMap<T>[N]["options"];
        const schemaName = name.toString();
        this.schemas?.[type][schemaName]?.forEach((schema) => Object.assign(newParams, schema.options));
        Object.assign(newParams, options);
        return newParams;
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
    public setAction<T extends ModelLike>(target: InstanceType<T>, methodName: string, action: ActionDefinition<T>) {
        Reflect.defineMetadata(`action:method:${methodName}`, action, target);
        Reflect.defineMetadata(`action:action:${String(action.params.name)}`, action, target);
    }

    /**
     * Searches for registered action by name and returns it
     *
     * @param target the model instance or class to get the attribute from
     * @param methodOrActionName the name of the method OR of the action
     * @returns the registered action with corresponding name if exists
     */
    public getAction<T extends ModelLike>(target: InstanceType<T>, methodOrActionName: string): ActionDefinition<T> | null {
        const byMethodName = Reflect.getMetadata(`action:method:${methodOrActionName}`, target);
        const byActionName = Reflect.getMetadata(`action:action:${methodOrActionName}`, target);
        return byActionName || byMethodName || null;
    }

    public setArgumentSchema<T extends ModelLike>(target: T, methodName: string, schema: ArgumentSchema<T>) {
        const args = Reflect.getOwnMetadata("arguments", target, methodName) || {};
        args[schema.name] = schema;
        Reflect.defineMetadata(`arguments`, args, target, methodName);
    }
}
