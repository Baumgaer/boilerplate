import { mergeWith } from "lodash";
import MetadataStore from "~common/lib/MetadataStore";
import ModelClassFactory from "~common/lib/ModelClass";
import ModelSchema from "~common/lib/ModelSchema";
import AttributeSchema from "~env/lib/AttributeSchema";
import type BaseModel from "~common/lib/BaseModel";
import type { AttrOptions, AttrOptionsWithMetadataJson, AttrOptionsPartialMetadataJson, AttrObserverTypes } from "~common/types/AttributeSchema";
import type { IMetadata } from "~common/types/MetadataTypes";
import type { ModelOptions } from "~common/types/ModelClass";

export function Model<T extends typeof BaseModel>(options: ModelOptions<T>): ClassDecorator {
    const metadataStore = new MetadataStore();

    return (target: any) => {
        // Set the class name and collectionName on prototype to have access to
        // that properties on whole prototype chain
        const proto = Object.getPrototypeOf(target);
        proto.className = options.className;
        proto.collectionName = options.collectionName;

        const modelClass = ModelClassFactory(target, options);
        const attributeDefinitions = metadataStore.getAttributeSchemas(target);
        for (const attributeDefinition of attributeDefinitions) attributeDefinition.setModelClass(modelClass);
        const modelSchema = new ModelSchema(modelClass, target.className, attributeDefinitions, options);
        metadataStore.setModelSchema(target, target.className, modelSchema);
        return modelClass;
    };
}

export function Attr<T extends typeof BaseModel>(options: AttrOptions<T> = {}): PropertyDecorator {
    const metadataStore = new MetadataStore();
    const metadata: IMetadata = JSON.parse((<AttrOptionsWithMetadataJson<T>>options).metadataJson);
    const metadataOptions: AttrOptionsPartialMetadataJson<T> = mergeWith({}, <AttrOptionsWithMetadataJson<T>>options, metadata);
    delete metadataOptions.metadataJson;

    return (target) => {
        // We need to use the constructor to have the correct class type for
        // the AttributeSchema. This has to be corrected when the property
        // decorators of third party tools are used later on. In this case we
        // need the prototype property (not the prototype of the chain)
        // of this constructor
        const theTarget = <T>target.constructor;
        const attrName = <keyof T>metadataOptions.name.toString();
        const options = metadataStore.constructAttributeSchemaParams<T>(attrName, metadataOptions);
        const attributeDefinition = new AttributeSchema<T>(theTarget, attrName, options);
        metadataStore.setAttributeSchema(theTarget, attrName, attributeDefinition);
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
    return (target: Partial<T>, _methodName: string | symbol, descriptor: TypedPropertyDescriptor<(value: any, parameters?: ObserverParameters<any>) => void>) => {
        Reflect.defineMetadata(`${attributeName}:observer:${type}`, descriptor, target);
    };
}

export function AttrTransformer<T>(attributeName: keyof T, type: AttrObserverTypes) {
    return (target: Partial<T>, _methodName: string | symbol, descriptor: TypedPropertyDescriptor<(value: T[typeof attributeName], user: any) => T[typeof attributeName]>) => {
        Reflect.defineMetadata(`${attributeName}:transformer:${type}`, descriptor, target);
    };
}
