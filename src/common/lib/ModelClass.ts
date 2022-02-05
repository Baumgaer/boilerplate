import type { Constructor } from "type-fest";
import type BaseModel from "~common/lib/BaseModel";
import Attribute from "~common/lib/Attribute";
import type { IMetadata } from "~common/types/MetadataTypes";
import { model, Schema, type SchemaDefinition } from "mongoose";

export default function ModelClassFactory<T extends Constructor<BaseModel>>(ctor: T) {

    // Remove ModelClass from prototype chain of ctor to avoid double registration
    // of proxy and other ModelClass stuff
    if ((<any>ctor).isModelClass) {
        const classPrototype = Reflect.getPrototypeOf(ctor);
        const prototype: any = classPrototype && Reflect.getPrototypeOf(classPrototype);
        if (classPrototype && (<any>prototype).isModelClass) Reflect.setPrototypeOf(classPrototype, Reflect.getPrototypeOf(prototype));
    }

    // Build attribute map to have access to raw declaration
    const attributeMap: Record<string, Attribute<T>> = {};
    Reflect.defineMetadata(`${ctor.name}:attributeMap`, attributeMap, ctor.prototype);
    const metadataKeys: string[] = Reflect.getMetadataKeys(ctor.prototype).reverse();
    for (const metadataKey of metadataKeys) {
        if (!metadataKey.endsWith("schemaDefinition")) continue;
        for (const key in Reflect.getMetadata(metadataKey, ctor.prototype)) {
            if (Object.prototype.hasOwnProperty.call(Reflect.getMetadata(metadataKey, ctor.prototype), key)) {
                const metadata: IMetadata = Reflect.getMetadata(metadataKey, ctor.prototype)[key];
                if (!(key in attributeMap)) {
                    attributeMap[key] = new Attribute(ctor, key, metadata);
                } else attributeMap[key].updateParameters(metadata);
            }
        }
    }

    // Create schema for data model
    const schemaDefinition: SchemaDefinition = {};
    for (const key in attributeMap) {
        if (Object.prototype.hasOwnProperty.call(attributeMap, key)) {
            const attribute = attributeMap[key];
            schemaDefinition[key] = attribute.toSchemaPropertyDefinition();
        }
    }
    const schema = new Schema(schemaDefinition);
    Reflect.defineMetadata(`${ctor.name}:schema`, schema, ctor.prototype);
    const DataModel = model<T>(Reflect.get(ctor, "className"), schema, Reflect.get(ctor, "collection"));
    Reflect.defineMetadata(`${ctor.name}:staticDataModel`, DataModel, ctor.prototype);

    return class ModelClass extends ctor {

        public static isModelClass = true;

        public isModelClass = true;

        protected static dataModel = DataModel;

        public constructor(...args: any[]) {
            super(...args);
            // @ts-expect-error yes it's read only but not during construction...
            this.dataModel = new DataModel(this.mergeProperties(args[0]));
            return new Proxy(this, this.proxyHandler);
        }

        private mergeProperties(properties: Record<string, any> = {}) {
            const defaults: Record<string, any> = {};
            for (const key in schemaDefinition) {
                if (Reflect.has(schemaDefinition, key)) defaults[key] = Reflect.get(this, key);
            }
            return Object.assign(defaults, properties);
        }

        private get(target: this, propertyName: string | symbol) {
            if (typeof propertyName === "symbol") return Reflect.get(target, propertyName);
            if (Reflect.has(schemaDefinition, propertyName)) return Reflect.get(this.dataModel, propertyName);
            return Reflect.get(target, propertyName);
        }

        private set(target: this, propertyName: string | symbol, value: any) {
            if (typeof propertyName === "symbol") return Reflect.set(target, propertyName, value);
            if (Reflect.has(schemaDefinition, propertyName)) return Reflect.set(this.dataModel, propertyName, value);
            return Reflect.set(target, propertyName, value);
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
