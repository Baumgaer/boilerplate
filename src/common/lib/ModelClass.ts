import { v4 as uuid } from "uuid";
import { reactive } from "vue";
import MetadataStore from "~common/lib/MetadataStore";
import BaseAttribute from "~env/lib/BaseAttribute";
import { hasOwnProperty, camelCase } from "~env/utils/utils";
import type { Constructor } from "type-fest";
import type { ModelOptions } from "~common/@types/ModelClass";
import type BaseModel from "~env/lib/BaseModel";

const attributes: Record<string, Constructor<BaseAttribute<typeof BaseModel>>> = {};
const context = require.context("~env/attributes/", true, /.+\.ts/, "sync");
context.keys().forEach((key) => {
    attributes[camelCase(key.substring(2, key.length - 3))] = (<ModuleLike<Constructor<BaseAttribute<typeof BaseModel>>>>context(key)).default;
});

export default function ModelClassFactory<T extends typeof BaseModel>(ctor: T & { isModelClass: boolean }, options: ModelOptions<T>) {

    // Remove ModelClass from prototype chain of ctor to avoid double registration
    // of proxy and other ModelClass stuff
    if (ctor.isModelClass) {
        const classPrototype = Reflect.getPrototypeOf(ctor);
        const prototype = classPrototype && Reflect.getPrototypeOf(classPrototype) as typeof ctor | null;
        if (classPrototype && prototype && prototype.isModelClass) Reflect.setPrototypeOf(classPrototype, Reflect.getPrototypeOf(prototype));
    }

    // eslint-disable-next-line prefer-const
    let constructorProxy: any;

    class ModelClass extends ctor {

        public static override isModelClass = true;

        public static override readonly className = options.className as string;

        public static override readonly collectionName = options.collectionName as string;

        public isModelClass = true;

        public override readonly className: string = options.className as string;

        public override readonly collectionName: string = options.collectionName as string;

        public constructor(...args: any[]) {
            super(...args);
            // @ts-expect-error yes it's read only but not during construction...
            this.unProxyfiedModel = this;
            let proxy = new Proxy(this, this.proxyHandler);
            proxy = reactive(proxy) as this;
            this.createAttributes(proxy);
            Object.assign(proxy, this.mergeProperties(args?.[0]));
            // If this is an initialization of an existing model, we dont
            // want to have the changes
            if (args?.[0]?.id) proxy.removeChanges();
            return proxy;
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

        private mergeProperties(properties: Record<string, any> = {}) {
            const attributeSchemas = this.getSchema()?.attributeSchemas;
            const defaults: Record<string, any> = {};
            if (!properties.id) this.dummyId = uuid();
            for (const key in attributeSchemas) {
                if (hasOwnProperty(attributeSchemas, key)) defaults[key] = Reflect.get(this, key);
            }
            return Object.assign(defaults, properties);
        }

        private createAttributes(proxy: this) {
            const metadataStore = new MetadataStore();
            const attributeSchemas = this.getSchema()?.attributeSchemas || {};
            for (const key in attributeSchemas) {
                if (hasOwnProperty(attributeSchemas, key)) {
                    const attribute = new (attributes[key] || BaseAttribute)(proxy, key, Reflect.get(attributeSchemas, key));
                    metadataStore.setAttribute(proxy, key, attribute);
                }
            }
        }

        private getPropertyNames() {
            return Object.keys(this.getSchema()?.attributeSchemas || {});
        }

        private get(target: this, propertyName: string | symbol, receiver: this) {
            // because we manipulate the constructor name on the fly, we need to
            // return that manipulating proxy (see below) to ensure that behavior
            if (propertyName === "constructor") return constructorProxy;

            const metadataStore = new MetadataStore();
            const attributeSchemas = this.getSchema()?.attributeSchemas;
            const stringProperty = propertyName.toString();
            if (!attributeSchemas || !hasOwnProperty(attributeSchemas, stringProperty)) return Reflect.get(target, propertyName);
            return metadataStore.getAttribute(receiver, stringProperty)?.get();
        }

        private set(target: this, propertyName: string | symbol, value: any, receiver: this) {
            const metadataStore = new MetadataStore();
            const attributeSchemas = this.getSchema()?.attributeSchemas;
            const stringProperty = propertyName.toString();
            if (!attributeSchemas || !hasOwnProperty(attributeSchemas, stringProperty)) return Reflect.set(target, propertyName, value);
            return metadataStore.getAttribute(receiver, stringProperty)?.set(value) ?? false;
        }

    }

    // Manipulate the constructor name to be able to store the data in the
    // database the right way and to be able to minify the className on compile time
    // We need to disable that lint on this line to be able to provide the variable above
    // eslint-disable-next-line prefer-const
    constructorProxy = new Proxy(ModelClass, { get: (target, property) => property === "name" ? options.className : Reflect.get(target, property) });
    return constructorProxy;
}
