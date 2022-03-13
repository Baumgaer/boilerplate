import ModelClassFactory from "~common/lib/ModelClass";
import { mergeWith } from "lodash";
import AttributeSchema from "~common/lib/AttributeSchema";
import MetadataStore from "~common/lib/MetadataStore";
import type BaseModel from "~common/lib/BaseModel";
import type { AttrOptions, AttrOptionsWithMetadataJson, AttrOptionsPartialMetadataJson, AttrObserverTypes } from "~common/types/AttributeSchema";
import type { IMetadata } from "~common/types/MetadataTypes";
import type { ModelOptions } from "~common/types/ModelClass";
import type { Constructor } from "type-fest";
import ModelSchema from "~common/lib/ModelSchema";

export function Model<T extends BaseModel>(options: ModelOptions<T> = {}): ClassDecorator {
    const metadataStore = new MetadataStore();

    return (target: any) => {
        // Set the class name and collectionName on prototype to have access to
        // that properties on whole prototype chain
        const proto = Object.getPrototypeOf(target);
        proto.className = options.className;
        proto.collectionName = options.collectionName;

        const modelClass = <any>ModelClassFactory(<any>target, options);
        const attributeDefinitions = metadataStore.getAttributeDefinitions(target);
        for (const attributeDefinition of attributeDefinitions) attributeDefinition.setModelClass(modelClass);
        const modelSchema = new ModelSchema(modelClass, target.className, attributeDefinitions);
        metadataStore.setModelDefinition(target, target.className, modelSchema);
        return modelClass;
    };
}

export function Attr<T extends BaseModel>(options: AttrOptions<T> = {}): PropertyDecorator {
    const metadataStore = new MetadataStore();
    const metadata: IMetadata = JSON.parse((<AttrOptionsWithMetadataJson<T>>options).metadataJson);
    const metadataOptions: AttrOptionsPartialMetadataJson<T> = mergeWith({}, <AttrOptionsWithMetadataJson<T>>options, metadata);
    delete metadataOptions.metadataJson;

    return (target) => {
        const theTarget = <Constructor<T>>target.constructor;
        const attrName = <keyof T>metadataOptions.name.toString();
        const options = metadataStore.constructAttributeDefinitionParams<Constructor<T>>(attrName, metadataOptions);
        const attributeDefinition = new AttributeSchema<Constructor<T>>(theTarget, attrName, options);
        metadataStore.setAttributeDefinition(theTarget, attrName, attributeDefinition);
    };
}

export function AttrValidator<T>(attributeName: keyof T) {
    return (target: Partial<T>, _methodName: string | symbol, descriptor: TypedPropertyDescriptor<(value: T[typeof attributeName]) => boolean>) => {
        Reflect.defineMetadata(`${attributeName}:validator`, descriptor, target);
    };
}

export function AttrGetter<T>(attributeName: keyof T) {
    return (target: Partial<T>, _methodName: string | symbol, descriptor: TypedPropertyDescriptor<() => T[typeof attributeName]>) => {
        Reflect.defineMetadata(`${attributeName}:getter`, descriptor, target);
    };
}

export function AttrSetter<T>(attributeName: keyof T) {
    return (target: Partial<T>, _methodName: string | symbol, descriptor: TypedPropertyDescriptor<(value: T[typeof attributeName]) => T[typeof attributeName]>) => {
        Reflect.defineMetadata(`${attributeName}:setter`, descriptor, target);
    };
}

export function AttrObserver<T>(attributeName: keyof T, type: AttrObserverTypes) {
    return (target: Partial<T>, _methodName: string | symbol, descriptor: TypedPropertyDescriptor<(value: any) => void>) => {
        Reflect.defineMetadata(`${attributeName}:observer:${type}`, descriptor, target);
    };
}

export function AttrTransformer<T>(attributeName: keyof T, type: AttrObserverTypes) {
    return (target: Partial<T>, _methodName: string | symbol, descriptor: TypedPropertyDescriptor<(value: T[typeof attributeName], user: any) => T[typeof attributeName]>) => {
        Reflect.defineMetadata(`${attributeName}:transformer:${type}`, descriptor, target);
    };
}
