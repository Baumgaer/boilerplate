import type { Constructor } from "type-fest";
import type { AttrOptionsPartialMetadataJson } from "~common/types/AttributeSchema";
import type AttributeSchema from "./AttributeSchema";
import type BaseModel from "./BaseModel";

export default class MetadataStore {

    private static instance: MetadataStore;

    private attributeDefinitions: Record<string, AttributeSchema<any>[]> = {};

    public constructor() {
        if (MetadataStore.instance) return MetadataStore.instance;
        MetadataStore.instance = this;
        return this;
    }

    public setAttributeDefinition<T extends Constructor<BaseModel>>(target: T, attributeName: keyof InstanceType<T>, definition: AttributeSchema<T>) {
        const attrStr = attributeName.toString();
        if (!this.attributeDefinitions[attrStr]) {
            this.attributeDefinitions[attrStr] = [definition];
        } else this.attributeDefinitions[attrStr].push(definition);
        Reflect.defineMetadata(`${target.constructor.name}:${attributeName}:definition`, definition, target);
    }

    public getAttributeDefinition<T extends Constructor<BaseModel>>(target: T, attributeName: keyof InstanceType<T>): AttributeSchema<T> {
        return Reflect.getMetadata(`${target.constructor.name}:${attributeName}:definition`, target);
    }

    public mergeAttributeDefinitionParams<T extends Constructor<BaseModel>>(attributeName: keyof InstanceType<T>, params: AttrOptionsPartialMetadataJson<T>) {
        const newParams = {};
        this.attributeDefinitions[attributeName.toString()]?.forEach((attributeDefinition) => {
            Object.assign(newParams, attributeDefinition.parameters);
        });
        Object.assign(newParams, params);
        return <AttrOptionsPartialMetadataJson<T>>newParams;
    }
}
