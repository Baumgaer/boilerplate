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
        schema: ModelSchema<T>;
        usingInstance: InstanceType<ModelLike>;
        options: ModelOptionsPartialMetadataJson<T>;
    }
    Attribute: {
        schema: AttributeSchema<T>;
        usingInstance: BaseAttribute<T>;
        options: AttrOptionsPartialMetadataJson<T>;
    }
    Argument: {
        schema: ArgumentSchema<T>;
        usingInstance: never;
        options: ArgOptionsPartialMetadataJson<T>;
    }
    Action: {
        schema: ActionSchema<T>;
        usingInstance: never;
        options: ActionOptionsPartialMetadataJson<T>;
    }
}

type SchemaTypeNames<T extends ModelLike> = StringKeyOf<TypeNameTypeMap<T>>;
type SchemaTypes<T extends ModelLike> = ValueOf<TypeNameTypeMap<T>>["schema"];
type InstanceTypes<T extends ModelLike> = ValueOf<TypeNameTypeMap<T>>["usingInstance"];

type SchemasType<T extends ModelLike> = Record<SchemaTypeNames<T>, Record<string, any[]>>;
type InstancesType<T extends ModelLike> = Record<SchemaTypeNames<T>, WeakMap<InstanceType<T>, Record<string, InstanceTypes<T>>>>

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

    private schemas?: SchemasType<ModelLike>;

    private instances?: InstancesType<ModelLike>;

    public constructor() {
        if (MetadataStore.instance) return MetadataStore.instance;
        // @ts-expect-error test
        window.metadataStore = this;
        MetadataStore.instance = this;
        return this;
    }

    public setSchema<T extends ModelLike, N extends SchemaTypeNames<T>>(type: N, target: T, name: keyof T, schema: SchemaTypes<T>) {
        const schemaName = `${String(name)}:${String(schema.name)}`;

        if (!this.schemas) this.schemas = {} as SchemasType<T>;
        if (!this.schemas[type]) Reflect.set(this.schemas, type, {});
        if (!this.schemas[type][schemaName]) Reflect.set(this.schemas[type], schemaName, []);

        this.schemas[type]?.[schemaName].push(schema);
        Reflect.defineMetadata(`${target.name}:${schemaName}:${type}Definition`, schema, target);
    }

    public getSchema<T extends ModelLike, N extends SchemaTypeNames<T>>(type: N, target: T, name: keyof T, subSchemaName?: keyof T): TypeNameTypeMap<T>[N]["schema"] | null {
        if (!subSchemaName) subSchemaName = name;

        const schemaName = `${String(name)}:${String(subSchemaName)}`;
        if (this.schemas?.[type]?.[schemaName]?.at(-1)) return this.schemas?.[type]?.[schemaName].at(-1);

        return Reflect.getMetadata(`${target.name}:${schemaName}:${type}Definition`, target);
    }

    public getSchemas<T extends ModelLike, N extends SchemaTypeNames<T>>(type: N, target: T): TypeNameTypeMap<T>[N]["schema"][] {
        const schemas: Record<string, any> = {};
        const metadataKeys: string[] = Reflect.getMetadataKeys(target).slice().reverse();

        for (const key of metadataKeys) {
            const [_targetName, schemaName, subSchemaName, typeDefinitionName] = key.split(":");
            if (typeDefinitionName === `${type}Definition`) schemas[`${schemaName}:${subSchemaName}`] = Reflect.getMetadata(key, target);
        }

        return Object.values(schemas);
    }

    public constructSchemaParams<T extends ModelLike, N extends SchemaTypeNames<T>>(type: N, name: keyof T, options: TypeNameTypeMap<T>[N]["options"], subSchemaName?: keyof T) {
        if (!subSchemaName) subSchemaName = name;

        const newParams = {} as TypeNameTypeMap<T>[N]["options"];
        const schemaName = `${String(name)}:${String(subSchemaName)}`;
        this.schemas?.[type][schemaName]?.forEach((schema) => Object.assign(newParams, schema.options));
        Object.assign(newParams, options);

        return newParams;
    }

    public setInstance<T extends ModelLike, N extends SchemaTypeNames<T>>(type: N, target: InstanceType<T>, name: string, instance: TypeNameTypeMap<T>[N]["usingInstance"]) {

        if (!this.instances) this.instances = {} as InstancesType<ModelLike>;
        if (!this.instances[type]) this.instances[type] = new WeakMap();
        if (!this.instances[type].has(target)) this.instances[type].set(target, {});

        const instances = this.instances[type].get(target);
        if (instances) Reflect.set(instances, name, instance);
    }

    public getInstance<T extends ModelLike, N extends SchemaTypeNames<T>>(type: N, target: InstanceType<T>, name: string): TypeNameTypeMap<T>[N]["usingInstance"] | null {
        return this.instances?.[type]?.get(target)?.[String(name)] as any || null;
    }

    public getInstances<T extends ModelLike, N extends SchemaTypeNames<T>>(type: N, target: InstanceType<T>): TypeNameTypeMap<T>[N]["usingInstance"][] {
        return Object.values(this.instances?.[type]?.get(target) ?? {}) as TypeNameTypeMap<T>[N]["usingInstance"][];
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
