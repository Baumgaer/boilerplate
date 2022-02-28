import AttributeSchema from "~common/lib/AttributeSchema";
import { isChangeObservable, isChangeObserved, hasOwnProperty, camelCase } from "~common/utils/utils";
import DefaultAttribute from "~env/attributes/DefaultAttribute";
import { model, Schema, type SchemaDefinition, type SchemaDefinitionType } from "mongoose";
import onChange, { type ApplyData, type Options } from "on-change";
import { v4 as uuid } from "uuid";
import type { Constructor } from "type-fest";
import type BaseAttribute from "~common/lib/BaseAttribute";
import type BaseModel from "~common/lib/BaseModel";
import type { IMetadata } from "~common/types/MetadataTypes";

const attributes: Record<string, Constructor<BaseAttribute<BaseModel>>> = {};
const context = require.context("~env/attributes/", true, /.+\.ts/, "sync");
context.keys().forEach((key) => {
    attributes[camelCase(key.substring(2, key.length - 3))] = context(key).default;
});

export default function ModelClassFactory<T extends Constructor<BaseModel>>(ctor: T) {

    // Remove ModelClass from prototype chain of ctor to avoid double registration
    // of proxy and other ModelClass stuff
    if ((<any>ctor).isModelClass) {
        const classPrototype = Reflect.getPrototypeOf(ctor);
        const prototype: any = classPrototype && Reflect.getPrototypeOf(classPrototype);
        if (classPrototype && (<any>prototype).isModelClass) Reflect.setPrototypeOf(classPrototype, Reflect.getPrototypeOf(prototype));
    }

    // Build attribute map to have access to raw declaration
    const attributeSchemaMap: Record<string, AttributeSchema<T>> = {};
    Reflect.defineMetadata(`${ctor.name}:attributeSchemaMap`, attributeSchemaMap, ctor.prototype);
    const metadataKeys: string[] = Reflect.getMetadataKeys(ctor.prototype).reverse();
    for (const metadataKey of metadataKeys) {
        if (!metadataKey.endsWith("definition")) continue;
        for (const key in Reflect.getMetadata(metadataKey, ctor.prototype)) {
            if (hasOwnProperty(Reflect.getMetadata(metadataKey, ctor.prototype), key)) {
                const metadata: IMetadata = Reflect.getMetadata(metadataKey, ctor.prototype)[key];
                if (!(key in attributeSchemaMap)) {
                    attributeSchemaMap[key] = new AttributeSchema(ctor, key, metadata);
                } else attributeSchemaMap[key].updateParameters(metadata);
            }
        }
    }

    // Create schema for data model
    const schemaDefinition: Partial<SchemaDefinition<SchemaDefinitionType<T>>> = {};
    for (const key in attributeSchemaMap) {
        if (hasOwnProperty(attributeSchemaMap, key)) {
            const attribute = attributeSchemaMap[key];
            Reflect.set(schemaDefinition, key, attribute.toSchemaPropertyDefinition());
        }
    }

    const schema = new Schema<T>(<SchemaDefinition<SchemaDefinitionType<T>>>schemaDefinition, { _id: false });
    Reflect.defineMetadata(`${ctor.name}:schema`, schema, ctor.prototype);
    const DataModel = model<T>(Reflect.get(ctor, "className"), schema, Reflect.get(ctor, "collection"));
    Reflect.defineMetadata(`${ctor.name}:staticDataModel`, DataModel, ctor.prototype);

    class ModelClass extends ctor {

        public static isModelClass = true;

        public isModelClass = true;

        protected static dataModel = DataModel;

        private observedAttributes: Record<string, any> = {};

        public constructor(...args: any[]) {
            super(...args);
            // @ts-expect-error yes it's read only but not during construction...
            this.unProxyfiedModel = this;
            // @ts-expect-error yes it's read only but not during construction...
            this.dataModel = new DataModel(this.mergeProperties(args[0]));
            const proxy = new Proxy(this, this.proxyHandler);
            this.createAttributes(proxy);
            console.log(proxy);
            return proxy;
        }

        private mergeProperties(properties: Record<string, any> = {}) {
            const defaults: Record<string, any> = {};
            if (!properties.id) this.dummyId = uuid();

            for (const key in schemaDefinition) {
                if (hasOwnProperty(schemaDefinition, key)) {
                    const value = Reflect.get(this, key);
                    if (this.musstObserveChanges(key, value)) {
                        this.observedAttributes[key] = onChange(value, (...args) => this.changeCallback(key, ...args), this.changeCallbackOptions);
                    }
                    defaults[key] = value;
                }
            }
            return Object.assign(defaults, properties);
        }

        private createAttributes(proxy: this) {
            for (const key in schemaDefinition) {
                if (Object.prototype.hasOwnProperty.call(schemaDefinition, key)) {
                    const attribute = new (attributes[key] || DefaultAttribute)(proxy, key, attributeSchemaMap[key]);
                    Reflect.defineMetadata(`${ctor.name}:${key}:attribute`, attribute, this);
                }
            }
        }

        private getPropertyNames() {
            return Object.keys(schemaDefinition);
        }

        private get(target: this, propertyName: string | symbol, proxy: any) {
            const stringProperty = propertyName.toString();
            if (!hasOwnProperty(schemaDefinition, stringProperty)) return Reflect.get(target, propertyName);
            const hookValue = this.callHook("getter", proxy, target, stringProperty);
            return hookValue !== undefined ? hookValue : this.observedAttributes[stringProperty] ?? Reflect.get(target.dataModel, stringProperty);
        }

        private set(target: this, propertyName: string | symbol, value: any, proxy: any) {
            const stringProperty = propertyName.toString();
            if (!hasOwnProperty(schemaDefinition, stringProperty)) return Reflect.set(target, propertyName, value);

            const hookValue = this.callHook("setter", proxy, target, stringProperty, value);
            const oldValue = this.observedAttributes[stringProperty] ?? Reflect.get(target.dataModel, stringProperty);
            let newValue = hookValue !== undefined ? hookValue : value;
            if (this.musstObserveChanges(stringProperty, newValue)) {
                newValue = onChange(newValue, (...args) => this.changeCallback(stringProperty, ...args), this.changeCallbackOptions);
                this.observedAttributes[stringProperty] = newValue;
            } else if (stringProperty in this.observedAttributes) delete this.observedAttributes[stringProperty];

            const setResult = Reflect.set(target.dataModel, stringProperty, newValue);
            if (setResult && oldValue !== newValue) this.callHook("observer:change", proxy, target, stringProperty, newValue);
            return setResult;
        }

        private changeCallback(propertyName: string, path: (string | symbol)[], value: unknown, previousValue: unknown, applyData: ApplyData): void {
            Reflect.set(this.dataModel, propertyName, this.observedAttributes[propertyName]);
            console.log(propertyName, path, value, previousValue, applyData);
        }

        private musstObserveChanges(propertyName: string, value: any) {
            return this.hasHook(propertyName, ["observer:add", "observer:remove"]) && isChangeObservable(value) && !isChangeObserved(value);
        }

        private hasHook(propertyName: string, hookName: string | string[]) {
            const check = (name: string) => Boolean(Reflect.getMetadata(`${propertyName}:${name}`, ctor.prototype));
            if (hookName instanceof Array) return hookName.some((name) => check(name));
            return check(hookName);
        }

        private callHook(name: string, proxy: any, target: this, propertyName: string, value?: any) {
            const activeHookMetaKey = `${ctor.name}:${propertyName}:active${name}`;
            const hook = Reflect.getMetadata(`${propertyName}:${name}`, ctor.prototype);
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

        private get changeCallbackOptions(): Options & { pathAsArray: true } {
            return { isShallow: true, pathAsArray: true, details: true };
        }
    }

    schema.loadClass(ModelClass);
    return ModelClass;
}
