import Attribute from "~common/lib/Attribute";
import { isChangeObservable, isChangeObserved } from "~common/utils/utils";
import { model, Schema, type SchemaDefinition } from "mongoose";
import onChange, { type ApplyData } from "on-change";
import type { Constructor } from "type-fest";
import type BaseModel from "~common/lib/BaseModel";
import type { IMetadata } from "~common/types/MetadataTypes";

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
        if (!metadataKey.endsWith("definition")) continue;
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
            const proxy = new Proxy(this, this.proxyHandler);
            console.log(proxy);
            return proxy;
        }

        private mergeProperties(properties: Record<string, any> = {}) {
            const defaults: Record<string, any> = {};
            for (const key in schemaDefinition) {
                if (Reflect.has(schemaDefinition, key)) defaults[key] = Reflect.get(this, key);
            }
            return Object.assign(defaults, properties);
        }

        private getPropertyNames() {
            return Object.keys(schemaDefinition);
        }

        private get(target: this, propertyName: string | symbol, proxy: any) {
            const stringProperty = propertyName.toString();
            if (!schemaDefinition.hasOwnProperty.call(schemaDefinition, stringProperty)) {
                return Reflect.get(target, propertyName);
            }
            const hookValue = this.callHook("getter", proxy, target, stringProperty);
            return hookValue !== undefined ? hookValue : Reflect.get(target.dataModel, stringProperty);
        }

        private set(target: this, propertyName: string | symbol, value: any, proxy: any) {
            const stringProperty = propertyName.toString();
            if (!schemaDefinition.hasOwnProperty.call(schemaDefinition, stringProperty)) {
                return Reflect.set(target, propertyName, value);
            }

            const oldValue = Reflect.get(target.dataModel, stringProperty);
            const hookValue = this.callHook("setter", proxy, target, stringProperty, value);
            let newValue = hookValue !== undefined ? hookValue : value;

            if (this.musstObserveChanges(stringProperty, newValue)) {
                newValue = onChange(newValue, this.changeCallback.bind(this), {
                    isShallow: true,
                    pathAsArray: true,
                    details: true
                });
            }

            const setResult = Reflect.set(target.dataModel, stringProperty, newValue);
            try {
                if (setResult && oldValue !== newValue) this.callHook("observer:change", proxy, target, stringProperty, newValue);
            } catch (error) {
                if (error instanceof TypeError) return false;
                throw error;
            }

            return setResult;
        }

        private changeCallback(_path: (string | symbol)[], _value: unknown, _previousValue: unknown, _applyData: ApplyData): void {
            // pass
        }

        private musstObserveChanges(propertyName: string, value: any) {
            return this.hasHook(propertyName, ["observer:add", "observer:remove"]) && isChangeObservable(value) && !isChangeObserved(value);
        }

        private hasHook(propertyName: string, hookName: string | string[]) {
            const check = (name: string) => Boolean(Reflect.getMetadata(`${ctor.name}:${propertyName}:${name}`, ctor.prototype));
            if (hookName instanceof Array) return hookName.some((name) => check(name));
            return check(hookName);
        }

        private callHook(name: string, proxy: any, target: this, propertyName: string, value?: any) {
            const activeHookMetaKey = `${ctor.name}:${propertyName}:active${name}`;
            const hook = Reflect.getMetadata(`${ctor.name}:${propertyName}:${name}`, ctor.prototype);
            if (!hook || Reflect.getMetadata(activeHookMetaKey, target)) return;

            Reflect.defineMetadata(activeHookMetaKey, true, target);
            value = hook.value.call(proxy, value);
            Reflect.defineMetadata(activeHookMetaKey, false, target);

            return value;
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
                ownKeys: this.getPropertyNames.bind(this),
                isExtensible: (target) => Reflect.isExtensible(target),
                preventExtensions: (target) => Reflect.preventExtensions(target),
                construct: (target, argArray) => Reflect.construct(<any>target, argArray)
            };
        }
    };
}
