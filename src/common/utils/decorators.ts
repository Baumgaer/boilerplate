import { mergeWith } from "lodash";
import MetadataStore from "~common/lib/MetadataStore";
import ModelClassFactory from "~common/lib/ModelClass";
import ModelSchema from "~common/lib/ModelSchema";
import AttributeSchema from "~env/lib/AttributeSchema";
import type { AttrOptions, AttrOptionsWithMetadataJson, AttrOptionsPartialMetadataJson, AttrObserverTypes } from "~common/@types/AttributeSchema";
import type { IAttrMetadata, IModelMetadata } from "~common/@types/MetadataTypes";
import type { ModelOptions, ModelOptionsPartialMetadataJson, ModelOptionsWithMetadataJson } from "~common/@types/ModelClass";
import type BaseModel from "~env/lib/BaseModel";

export function Model<T extends typeof BaseModel>(options: ModelOptions<T> = {}): ClassDecorator {
    const metadataStore = new MetadataStore();
    const metadata: IModelMetadata = JSON.parse((<ModelOptionsWithMetadataJson<T>>options).metadataJson);
    const metadataOptions: ModelOptionsPartialMetadataJson<T> = mergeWith({}, metadata, <ModelOptionsWithMetadataJson<T>>options);
    delete metadataOptions.metadataJson;

    return (target: any) => {
        // Set the class name and collectionName on prototype to have access to
        // that properties on whole prototype chain
        const options = metadataOptions;
        const proto: typeof BaseModel = Object.getPrototypeOf(target);
        // @ts-expect-error This is readonly to prevent setting it while normal development
        proto.className = options.className;
        // @ts-expect-error This is readonly to prevent setting it while normal development
        proto.collectionName = options.collectionName;

        const modelClass = ModelClassFactory(target, options);
        const attributeDefinitions = metadataStore.getAttributeSchemas(target);
        for (const attributeDefinition of attributeDefinitions) attributeDefinition.setOwner(modelClass);
        const modelSchema = new ModelSchema(modelClass, target.className, attributeDefinitions, options);
        metadataStore.setModelSchema(target, target.className, modelSchema);
        return modelClass;
    };
}

export function Attr<T extends typeof BaseModel>(options: AttrOptions<T> = {}): PropertyDecorator {
    const metadataStore = new MetadataStore();
    const metadata: IAttrMetadata = JSON.parse((<AttrOptionsWithMetadataJson<T>>options).metadataJson);
    const metadataOptions: AttrOptionsPartialMetadataJson<T> = mergeWith({}, metadata, <AttrOptionsWithMetadataJson<T>>options);
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
    return (target: Partial<T>, _methodName: string | symbol, descriptor: TypedPropertyDescriptor<GeneralHookFunction<T[typeof attributeName], boolean>>) => {
        Reflect.defineMetadata(`${attributeName}:validator`, descriptor, target);
    };
}

export function AttrGetter<T>(attributeName: keyof T) {
    return (target: Partial<T>, _methodName: string | symbol, descriptor: TypedPropertyDescriptor<() => T[typeof attributeName]>) => {
        Reflect.defineMetadata(`${attributeName}:getter`, descriptor, target);
    };
}

export function AttrSetter<T>(attributeName: keyof T) {
    return (target: Partial<T>, _methodName: string | symbol, descriptor: TypedPropertyDescriptor<GeneralHookFunction<T[typeof attributeName], T[typeof attributeName]>>) => {
        Reflect.defineMetadata(`${attributeName}:setter`, descriptor, target);
    };
}

export function AttrObserver<T>(attributeName: keyof T, type: AttrObserverTypes) {
    return (target: Partial<T>, _methodName: string | symbol, descriptor: TypedPropertyDescriptor<ObserverHookFunction<any>>) => {
        Reflect.defineMetadata(`${attributeName}:observer:${type}`, descriptor, target);
    };
}

export function AttrTransformer<T>(attributeName: keyof T, type: AttrObserverTypes) {
    return (target: Partial<T>, _methodName: string | symbol, descriptor: TypedPropertyDescriptor<TransformerHookFunction<T[typeof attributeName], unknown>>) => {
        Reflect.defineMetadata(`${attributeName}:transformer:${type}`, descriptor, target);
    };
}
