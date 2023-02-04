import ApiClient from "~env/lib/ApiClient";
import { isUndefined } from "~env/utils/utils";
import type { ActionOptions } from "~env/@types/ActionSchema";
import type { ModelLike } from "~env/@types/ModelClass";
import type ActionSchema from "~env/lib/ActionSchema";
import type BaseModel from "~env/lib/BaseModel";

export default class BaseAction<T extends ModelLike> {

    /**
     * Holds the instance which holds the attribute. This instance is a proxy
     * which detects changes to any attribute which were made.
     */
    public readonly owner: T | InstanceType<T>;

    /**
     * The name of the attribute which corresponds by the attribute name in
     * the code or an alias defined in the @Attr() decorator
     */
    public readonly name: keyof InstanceType<T>;

    /**
     * The schema of the attribute which gives more information.
     */
    public readonly schema: ActionSchema<T>;

    /**
     * Same instance as owner but without proxy to be able to set the value
     * without change detection. Setting the value over this instance avoids
     * infinite loops.
     */
    protected readonly unProxyfiedOwner: T | InstanceType<T>;

    public constructor(owner: T | InstanceType<T>, name: keyof (InstanceType<T> | T), attributeSchema: ActionSchema<T>) {
        this.owner = owner;
        this.unProxyfiedOwner = owner.unProxyfiedModel as T | InstanceType<T>;
        this.name = name;
        this.schema = attributeSchema;
    }

    public get() {
        return (...args: any[]) => this.call(this.owner, ...args);
    }

    public call(thisArg: T | InstanceType<T>, ...args: any[]) {

        let newThisArg: T | InstanceType<T> | BaseModel = thisArg;
        if ("isBaseModel" in thisArg && thisArg.isBaseModel) newThisArg = new Proxy(thisArg as BaseModel, this.getProxyHandler(thisArg));
        const result = this.schema.descriptor.value?.call(newThisArg, ...args);
        const entries = Object.entries(this.schema.argumentSchemas);

        const parameters = entries.filter((entry) => {
            return !entry[1].primary && !isUndefined(args[entry[1].index || 0]);
        }).map((entry) => [entry[0], args[entry[1].index || 0]]) as [string, any][];

        let id = "";
        let idParameterIndex = entries.findIndex((entry) => Boolean(entry[1].primary));
        if ("isNew" in thisArg && !thisArg.isNew()) {
            id = thisArg.getId();
        } else if (idParameterIndex > -1) {
            idParameterIndex = entries[idParameterIndex][1].index || 0;
            if (isUndefined(args[idParameterIndex])) {
                id = "";
            } else id = args[idParameterIndex];
        }

        if (!this.schema.local) {
            const httpMethod = (this.schema.httpMethod?.toLowerCase() || "get") as Lowercase<Exclude<ActionOptions<T>["httpMethod"], undefined>>;
            ApiClient[httpMethod]({ collectionName: thisArg.collectionName, actionName: String(this.name || ""), id, parameters });
        }

        return result || Promise.resolve();
    }

    /**
         * The proxy handler object for the instance proxy. This has to be
         * complete to ensure a full working proxy
         */
    /* istanbul ignore next Not needed to bee tested because it's just an assignment */
    private getProxyHandler(thisArg: BaseModel): ProxyHandler<BaseModel> {
        return {
            get: (target, propertyName, _receiver) => thisArg._get(target.unProxyfiedModel, propertyName, target),
            set: (target, propertyName, value, _receiver) => thisArg._set(target.unProxyfiedModel, propertyName, value, target, String(this.name)),
            defineProperty: (target, propertyName, attributes) => Reflect.defineProperty(target, propertyName, attributes),
            deleteProperty: (target, propertyName) => Reflect.deleteProperty(target, propertyName),
            apply: (target, thisArg, argArray) => Reflect.apply(<any>target, thisArg, argArray),
            has: (target, propertyName) => Reflect.has(target, propertyName),
            getOwnPropertyDescriptor: (target, propertyName) => Reflect.getOwnPropertyDescriptor(target, propertyName),
            setPrototypeOf: (target, v) => Reflect.setPrototypeOf(target, v),
            getPrototypeOf: (target) => Reflect.getPrototypeOf(target),
            ownKeys: () => thisArg._getPropertyNames(),
            isExtensible: (target) => Reflect.isExtensible(target),
            preventExtensions: (target) => Reflect.preventExtensions(target),
            construct: (target, argArray) => Reflect.construct(<any>target, argArray)
        };
    }
}
