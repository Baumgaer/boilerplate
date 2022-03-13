import { Entity } from "typeorm";
import { v4 as uuid } from "uuid";
import { reactive } from "vue";
import { hasOwnProperty, camelCase } from "~common/utils/utils";
import DefaultAttribute from "~env/attributes/DefaultAttribute";
import type { Constructor } from "type-fest";
import type BaseAttribute from "~common/lib/BaseAttribute";
import type BaseModel from "~common/lib/BaseModel";
import type { ModelOptions } from "~common/types/ModelClass";

const attributes: Record<string, Constructor<BaseAttribute<BaseModel>>> = {};
const context = require.context("~env/attributes/", true, /.+\.ts/, "sync");
context.keys().forEach((key) => {
    attributes[camelCase(key.substring(2, key.length - 3))] = context(key).default;
});

export default function ModelClassFactory<T extends Constructor<BaseModel>>(ctor: T, options: ModelOptions<T>) {

    // Remove ModelClass from prototype chain of ctor to avoid double registration
    // of proxy and other ModelClass stuff
    if ((<any>ctor).isModelClass) {
        const classPrototype = Reflect.getPrototypeOf(ctor);
        const prototype: any = classPrototype && Reflect.getPrototypeOf(classPrototype);
        if (classPrototype && (<any>prototype).isModelClass) Reflect.setPrototypeOf(classPrototype, Reflect.getPrototypeOf(prototype));
    }

    class ModelClass extends ctor {

        public static isModelClass = true;

        public isModelClass = true;

        public static readonly className = <string>options.className;

        public static readonly collectionName = <string>options.collectionName;

        public override readonly className = (<typeof ModelClass>this.constructor).className;

        public override readonly collectionName = (<typeof ModelClass>this.constructor).collectionName;

        public constructor(...args: any[]) {
            super(...args);
            // @ts-expect-error yes it's read only but not during construction...
            this.unProxyfiedModel = this;
            let proxy = new Proxy(this, this.proxyHandler);
            this.createAttributes(proxy);
            proxy = reactive(proxy) as this;
            Object.assign(proxy, this.mergeProperties(args[0]));
            console.log(proxy);
            return proxy;
        }

        private mergeProperties(properties: Record<string, any> = {}) {
            const attributeSchemas = this.getSchema().attributeSchemas;
            const defaults: Record<string, any> = {};
            if (!properties.id) this.dummyId = uuid();
            for (const key in attributeSchemas) {
                if (hasOwnProperty(attributeSchemas, key)) defaults[key] = Reflect.get(this, key);
            }
            return Object.assign(defaults, properties);
        }

        private createAttributes(proxy: this) {
            const attributeSchemas = this.getSchema().attributeSchemas;
            for (const key in attributeSchemas) {
                if (Object.prototype.hasOwnProperty.call(attributeSchemas, key)) {
                    const attribute = new (attributes[key] || DefaultAttribute)(proxy, key, attributeSchemas[key]);
                    Reflect.defineMetadata(`${ctor.name}:${key}:attribute`, attribute, this);
                }
            }
        }

        private getPropertyNames() {
            return Object.keys(this.getSchema().attributeSchemas || {});
        }

        private get(target: this, propertyName: string | symbol) {
            const attributeSchemas = this.getSchema().attributeSchemas;
            const stringProperty = propertyName.toString();
            if (!hasOwnProperty(attributeSchemas, stringProperty)) return Reflect.get(target, propertyName);
            return this.getAttribute(stringProperty).get();
        }

        private set(target: this, propertyName: string | symbol, value: any) {
            const attributeSchemas = this.getSchema().attributeSchemas;
            const stringProperty = propertyName.toString();
            if (!hasOwnProperty(attributeSchemas, stringProperty)) return Reflect.set(target, propertyName, value);
            return this.getAttribute(stringProperty).set(value);
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
    }

    Entity(options.collectionName, options)(ModelClass);
    return ModelClass;
}
