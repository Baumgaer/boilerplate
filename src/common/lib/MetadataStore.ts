import { uniq } from "~env/utils/utils";
import type { FilterFunction, InstancesType, SchemasType } from "~env/@types/MetadataStore";
import type { TypeNameTypeMap, SchemaTypeNames, SchemaTypes } from "~env/@types/Schema";
import type SchemaBased from "~env/lib/SchemaBased";

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

    private schemas?: SchemasType<typeof SchemaBased>;

    private instances?: InstancesType<typeof SchemaBased>;

    public constructor() {
        if (MetadataStore.instance) return MetadataStore.instance;
        // @ts-expect-error for testing
        global.metadataStore = this;
        MetadataStore.instance = this;
        return this;
    }

    public setSchema<T extends typeof SchemaBased, N extends SchemaTypeNames<T>>(type: N, target: T, name: TypeNameTypeMap<T>[N]["nameType"], schema: SchemaTypes<T>) {
        const dotName = String("namespace" in schema ? schema.namespace : schema.name);
        const schemaName = `${String(name)}__:__${dotName}`;

        if (!this.schemas) this.schemas = {} as SchemasType<T>;
        if (!this.schemas[type]) Reflect.set(this.schemas, type, {});
        if (!this.schemas[type][schemaName]) Reflect.set(this.schemas[type], schemaName, []);

        this.schemas[type]?.[schemaName].push(schema);
        Reflect.defineMetadata(`${target.name}__:__${schemaName}__:__${type}Definition`, schema, target);
    }

    public getSchema<T extends typeof SchemaBased, N extends SchemaTypeNames<T>>(type: N, target: T, name: TypeNameTypeMap<T>[N]["nameType"], subSchemaName?: TypeNameTypeMap<T>[N]["nameType"]): TypeNameTypeMap<T>[N]["schema"] | null {
        if (!subSchemaName) subSchemaName = name;

        const schemaName = `${String(name)}__:__${String(subSchemaName)}`;
        if (this.schemas?.[type]?.[schemaName]?.at(-1)) return this.schemas?.[type]?.[schemaName].at(-1);

        return Reflect.getMetadata(`${target.name}__:__${schemaName}__:__${type}Definition`, target);
    }

    public getSchemas<T extends typeof SchemaBased, N extends SchemaTypeNames<T>>(type: N, target: T, filter: FilterFunction = () => true): TypeNameTypeMap<T>[N]["schema"][] {
        const schemas: Record<string, any> = {};
        const metadataKeys: string[] = Reflect.getMetadataKeys(target).slice().reverse();

        for (const key of metadataKeys) {
            const [targetName, schemaName, subSchemaName, typeDefinitionName] = key.split("__:__");
            if (typeDefinitionName === `${type}Definition` && filter(targetName, schemaName, subSchemaName, typeDefinitionName)) schemas[`${schemaName}__:__${subSchemaName}`] = Reflect.getMetadata(key, target);
        }

        return Object.values(schemas);
    }

    public constructSchemaParams<T extends typeof SchemaBased, N extends SchemaTypeNames<T>>(type: N, name: TypeNameTypeMap<T>[N]["nameType"], options: TypeNameTypeMap<T>[N]["options"], subSchemaName?: TypeNameTypeMap<T>[N]["nameType"]) {
        if (!subSchemaName) subSchemaName = name;

        const newParams = {} as TypeNameTypeMap<T>[N]["options"];
        const schemaName = `${String(name)}__:__${String(subSchemaName)}`;
        this.schemas?.[type]?.[schemaName]?.forEach((schema) => Object.assign(newParams, schema.options));
        Object.assign(newParams, options);

        return newParams;
    }

    public setInstance<T extends typeof SchemaBased, N extends SchemaTypeNames<T>>(type: N, target: T | InstanceType<T>, name: TypeNameTypeMap<T>[N]["nameType"], instance: TypeNameTypeMap<T>[N]["usingInstance"]) {

        if (!this.instances) this.instances = {} as InstancesType<typeof SchemaBased>;
        if (!this.instances[type]) this.instances[type] = new WeakMap();
        if (!this.instances[type].has(target)) this.instances[type].set(target, {});

        const instances = this.instances[type].get(target);
        if (instances) Reflect.set(instances, name, instance);
    }

    public getInstance<T extends typeof SchemaBased, N extends SchemaTypeNames<T>>(type: N, target: T | InstanceType<T>, name: TypeNameTypeMap<T>[N]["nameType"]): TypeNameTypeMap<T>[N]["usingInstance"] | null {
        const namedInstance = this.instances?.[type]?.get(target)?.[String(name)] as any;
        const internalInstance = this.instances?.[type]?.get(target)?.[`internal_${String(name)}`];
        return namedInstance ?? internalInstance ?? null;
    }

    public getInstances<T extends typeof SchemaBased, N extends SchemaTypeNames<T>>(type: N, target: T | InstanceType<T>): TypeNameTypeMap<T>[N]["usingInstance"][] {
        return uniq(Object.values(this.instances?.[type]?.get(target) ?? {})) as TypeNameTypeMap<T>[N]["usingInstance"][];
    }
}
