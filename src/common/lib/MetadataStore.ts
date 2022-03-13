import type { Constructor } from "type-fest";
import type AttributeSchema from "~common/lib/AttributeSchema";
import type BaseModel from "~common/lib/BaseModel";
import type ModelSchema from "~common/lib/ModelSchema";
import type { AttrOptionsPartialMetadataJson } from "~common/types/AttributeSchema";

export default class MetadataStore {

    private static instance: MetadataStore;

    private attributeDefinitions: Record<string, AttributeSchema<any>[]> = {};

    private modelDefinitions: Record<string, ModelSchema<any>> = {};

    public constructor() {
        if (MetadataStore.instance) return MetadataStore.instance;
        MetadataStore.instance = this;
        return this;
    }

    public setAttributeSchema<T extends Constructor<BaseModel>>(target: T, attributeName: keyof InstanceType<T>, definition: AttributeSchema<T>) {
        const attrStr = attributeName.toString();
        if (!this.attributeDefinitions[attrStr]) {
            this.attributeDefinitions[attrStr] = [definition];
        } else this.attributeDefinitions[attrStr].push(definition);
        Reflect.defineMetadata(`${target.name}:${attributeName}:definition`, definition, target);
    }

    public getAttributeSchema<T extends Constructor<BaseModel>>(target: T, attributeName: keyof InstanceType<T>): AttributeSchema<T> | null {
        return Reflect.getMetadata(`${target.name}:${attributeName}:definition`, target) || null;
    }

    public getAttributeSchemas<T extends Constructor<BaseModel>>(target: T): AttributeSchema<T>[] {
        const attributeDefinitions: Record<string, AttributeSchema<T>> = {};
        const metadataKeys = Reflect.getMetadataKeys(target).slice().reverse();
        for (const key of metadataKeys) {
            const attributeName = key.split(":")[1];
            if (key.endsWith("definition")) attributeDefinitions[attributeName] = Reflect.getMetadata(key, target);
        }
        return Object.values(attributeDefinitions);
    }

    public constructAttributeSchemaParams<T extends Constructor<BaseModel>>(attributeName: keyof InstanceType<T>, params: AttrOptionsPartialMetadataJson<T>) {
        const newParams = {};
        this.attributeDefinitions[attributeName.toString()]?.forEach((attributeDefinition) => {
            Object.assign(newParams, attributeDefinition.parameters);
        });
        Object.assign(newParams, params);
        return <AttrOptionsPartialMetadataJson<T>>newParams;
    }

    public setModelSchema<T extends Constructor<BaseModel>>(target: T, schemaName: string, schema: ModelSchema<T>) {
        this.modelDefinitions[schemaName] = schema;
        Reflect.defineMetadata(`${target.constructor.name}:schema`, schema, target);
    }

    public getModelSchema<T extends Constructor<BaseModel>>(target?: T, schemaName?: string): ModelSchema<T> | null {
        if (schemaName && this.modelDefinitions[schemaName]) return this.modelDefinitions[schemaName];
        if (target) return Reflect.getMetadata(`${target.constructor.name}:schema`, target) || null;
        return null;
    }
}
