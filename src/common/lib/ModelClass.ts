// import { Schema } from "mongoose";
import { Constructor } from "type-fest";
import BaseModel from "~common/lib/BaseModel";
import Attribute from "~common/lib/Attribute";
import { IMetadata } from "~common/types/metadataTypes";

export default function ModelClassFactory<T extends Constructor<BaseModel>>(ctor: T) {

    // Remove ModelClass from prototype chain of ctor to avoid double registration
    // of proxy and other ModelClass stuff
    if ((<any>ctor).isModelClass) {
        const classPrototype = Reflect.getPrototypeOf(ctor);
        const prototype: any = classPrototype && Reflect.getPrototypeOf(classPrototype);
        if (classPrototype && (<any>prototype).isModelClass) Reflect.setPrototypeOf(classPrototype, Reflect.getPrototypeOf(prototype));
    }

    // Build schema definition for current model
    const attributeMap: Record<string, Attribute<T>> = {};
    for (const metadataKey of Reflect.getMetadataKeys(ctor.prototype).reverse()) {
        for (const key in Reflect.getMetadata(metadataKey, ctor.prototype)) {
            if (Object.prototype.hasOwnProperty.call(Reflect.getMetadata(metadataKey, ctor.prototype), key)) {
                const metadata: IMetadata = Reflect.getMetadata(metadataKey, ctor.prototype)[key];
                if (!(key in attributeMap)) {
                    attributeMap[key] = new Attribute(ctor, key, metadata);
                } else attributeMap[key].updateParameters(metadata);
            }
        }
    }

    Reflect.defineMetadata(`${ctor.name}:attributeMap`, attributeMap, ctor.prototype);

    return class ModelClass extends ctor {

        public static isModelClass = true;
        public isModelClass = true;

        public constructor(...args: any[]) {
            super(...args);
            return new Proxy(this, this.proxyHandler);
        }

        private get(target: this, propertyName: string | symbol, l: any) {
            console.log(l);
            if (typeof propertyName === "symbol") return Reflect.get(target, propertyName);
            return (<any>target)[propertyName];
        }

        private set(target: this, propertyName: string | symbol, value: any) {
            (<any>target)[propertyName] = value;
            return true;
        }

        private get proxyHandler(): ProxyHandler<this> {
            return {
                get: this.get.bind(this),
                set: this.set.bind(this),
                defineProperty: (target, propertyName, attributes) => Reflect.defineProperty(target, propertyName, attributes),
                deleteProperty: (target, propertyName) => Reflect.deleteProperty(target, propertyName),
                apply: (target, thisArg, argArray) => Reflect.apply(<any>target, thisArg, argArray),
                has: (target, propertyName) => Reflect.has(target, propertyName),
                getOwnPropertyDescriptor: (target, propertyName) => Reflect.getOwnPropertyDescriptor(target, propertyName),
                setPrototypeOf: (target, v) => Reflect.setPrototypeOf(target, v),
                getPrototypeOf: (target) => Reflect.getPrototypeOf(target),
                ownKeys: (target) => Reflect.ownKeys(target),
                isExtensible: (target) => Reflect.isExtensible(target),
                preventExtensions: (target) => Reflect.preventExtensions(target),
                construct: (target, argArray) => Reflect.construct(<any>target, argArray)
            };
        }
    };
}
