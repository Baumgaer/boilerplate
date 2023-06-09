import MetadataStore from "~server/lib/MetadataStore";
import RouteAction from "~server/lib/RouteAction";
import { hasOwnProperty } from "~server/utils/utils";
import type { RouteOptions } from "~server/@types/RouteClass";
import type BaseRoute from "~server/lib/BaseRoute";
import type BaseServer from "~server/lib/BaseServer";

const metadataStore = new MetadataStore();

export default function RouteClassFactory<T extends typeof BaseRoute>(ctor: T & { isRouteClass: boolean }, options: RouteOptions<T>) {

    // Remove RouteClass from prototype chain of ctor to avoid double registration
    // of proxy and other RouteClass stuff
    if (ctor.isRouteClass) {
        const classPrototype = Reflect.getPrototypeOf(ctor);
        const prototype = classPrototype && Reflect.getPrototypeOf(classPrototype) as typeof ctor | null;
        if (classPrototype && prototype && prototype.isRouteClass) Reflect.setPrototypeOf(classPrototype, Reflect.getPrototypeOf(prototype));
    }

    // eslint-disable-next-line prefer-const
    let constructorProxy: any;

    abstract class RouteClass extends ctor {

        /**
         * Identifies a route as a route class. This is needed because we are
         * not able to use the RouteClass as a value for "instanceof"
         * (because it's inside a factory). This is for example used above when
         * manipulating prototype chain.
         */
        public static override isRouteClass: boolean = true;

        /**
         * @inheritdoc
         */
        public static override readonly namespace: string = options.namespace as string;

        /**
         * @inheritdoc
         */
        public override namespace: string = options.namespace as string;

        /**
         * @see RouteClass.isRouteClass
         */
        public isRouteClass: boolean = true;

        public constructor(server: BaseServer, ...args: any[]) {
            super(server, ...args);
            // @ts-expect-error yes it's read only but not during construction...
            this.unProxyfiedObject = this;

            const proxy = new Proxy(this, this.proxyHandler);
            this.createActions(proxy);
            return proxy;
        }

        /**
         * The proxy handler object for the instance proxy. This has to be
         * complete to ensure a full working proxy
         */
        /* istanbul ignore next Not needed to bee tested because it's just an assignment */
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

        /**
         * Creates actions corresponding to their names.
         *
         * @param proxy the proxy on which the action should bew invoked
         */
        private createActions(proxy: this) {
            const actionSchemas = this.getSchema()?.actionSchemas;
            if (!actionSchemas) return;

            for (const key in actionSchemas) {
                if (hasOwnProperty(actionSchemas, key)) {
                    const { name, httpMethod } = actionSchemas[key];
                    const action = new RouteAction(proxy, name, actionSchemas[key], httpMethod);
                    metadataStore.setInstance<typeof BaseRoute, "Action">("Action", proxy, key, action);
                    metadataStore.setInstance<typeof BaseRoute, "Action">("Action", proxy, `internal_${actionSchemas[key].internalName}`, action);
                }
            }
        }

        /**
         * This is the get trap of the instance proxy. It distinguishes between
         * attributes and normal properties and reacts corresponding on the type.
         * If the property is an attribute it calls its getter and returns its value.
         *
         * @param target the instance of the model without proxy
         * @param propertyName the name of the accessed property
         * @param receiver the instance of the model with proxy
         * @returns the value of the asked attribute or property
         */
        private get(target: this, propertyName: string | symbol, receiver: this) {
            // HINT: Because the actions are stored on the proxy
            // instance and not on the model instance, we have to get the those
            // from the receiver which is equal to the proxy

            // because we manipulate the constructor name on the fly, we need to
            // return that manipulating proxy (see below) to ensure that behavior
            if (propertyName === "constructor") return constructorProxy;

            // Do not use receiver.getAction(stringProperty) because of recursion error
            const action = metadataStore.getInstance("Action", receiver, String(propertyName))?.get();
            if (action) return action;

            return Reflect.get(target, propertyName);
        }

        /**
         * This is the set trap of the instance proxy. Like the getter it
         * distinguishes between attributes and normal properties. If the
         * property is an attribute, it calls its setter and returns its return
         * value. This has to be a boolean. Otherwise JS will throw a ValueError.
         *
         * @param target the instance of the model without proxy
         * @param propertyName the name of the accessed property
         * @param value the value which has to be set on the property
         * @param receiver the instance of the model with proxy
         * @returns the value of the asked attribute or property
         */
        private set(target: this, propertyName: string | symbol, value: any, _receiver: this) {
            return Reflect.set(target, propertyName, value);
        }
    }

    // Manipulate the constructor name to be able to store the data in the
    // database the right way and to be able to minify the className on compile time.
    // We need to disable that lint on this line to be able to provide the variable above
    // eslint-disable-next-line prefer-const
    constructorProxy = new Proxy(RouteClass, {
        get(target, property) {
            const action = target.getAction(String(property));

            if (property === "unProxyfiedObject") return target;
            if (property === "name") return options.namespace;
            if (action) return action.get();
            return Reflect.get(target, property);
        }
    });

    return constructorProxy;
}
