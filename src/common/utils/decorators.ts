import ModelClassFactory from "~common/lib/ModelClass";
import { merge } from "lodash";
import type BaseModel from "~common/lib/BaseModel";
import type { AttrOptions, AttrOptionsWithMetadataJson, AttrOptionsPartialMetadataJson, AttrObserverTypes } from "~common/types/Decorators";
import type { IMetadata } from "~common/types/MetadataTypes";

export function Model(className: string, collection: string): ClassDecorator {
    return (target: any) => {
        target.className = className;
        target.collection = collection;
        return <any>ModelClassFactory(<any>target);
    };
}

export function Attr<T extends BaseModel>(options: AttrOptions<T> = {}): PropertyDecorator {
    const metadata: IMetadata = JSON.parse((<AttrOptionsWithMetadataJson<T>>options).metadataJson);
    const metadataOptions: AttrOptionsPartialMetadataJson<T> = merge({}, metadata, <AttrOptionsWithMetadataJson<T>>options);
    delete metadataOptions.metadataJson;

    return (target, attributeName) => {
        const attributeString = attributeName.toString();
        let attributeDefinition = Reflect.getMetadata(`${target.constructor.name}:${attributeString}:definition`, target);
        if (!attributeDefinition) {
            attributeDefinition = {};
            Reflect.defineMetadata(`${target.constructor.name}:${attributeString}:definition`, attributeDefinition, target);
        }
        attributeDefinition[attributeString] = metadataOptions;
    };
}

export function AttrValidator<T>(attributeName: keyof T) {
    return (target: T & BaseModel, _methodName: string | symbol, descriptor: TypedPropertyDescriptor<(value: T[typeof attributeName]) => T[typeof attributeName]>) => {
        Reflect.defineMetadata(`${target.constructor.name}:${attributeName}:validator`, descriptor, target);
    };
}

export function AttrGetter<T>(attributeName: keyof T) {
    return (target: T & BaseModel, _methodName: string | symbol, descriptor: TypedPropertyDescriptor<() => T[typeof attributeName]>) => {
        Reflect.defineMetadata(`${target.constructor.name}:${attributeName}:getter`, descriptor, target);
    };
}

export function AttrSetter<T>(attributeName: keyof T) {
    return (target: T & BaseModel, _methodName: string | symbol, descriptor: TypedPropertyDescriptor<(value: T[typeof attributeName]) => T[typeof attributeName]>) => {
        Reflect.defineMetadata(`${target.constructor.name}:${attributeName}:setter`, descriptor, target);
    };
}

export function AttrObserver<T>(attributeName: keyof T, type: AttrObserverTypes) {
    return (target: T & BaseModel, _methodName: string | symbol, descriptor: TypedPropertyDescriptor<(value: T[typeof attributeName]) => T[typeof attributeName]>) => {
        Reflect.defineMetadata(`${target.constructor.name}:${attributeName}:observer:${type}`, descriptor, target);
    };
}
