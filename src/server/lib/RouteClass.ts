import MetadataStore from "~server/lib/MetadataStore";
import RouteAction from "~server/lib/RouteAction";
import { hasOwnProperty } from "~server/utils/utils";
import type { RouteOptions } from "~server/@types/RouteClass";
import type BaseRoute from "~server/lib/BaseRoute";
import type BaseServer from "~server/lib/BaseServer";

const metadataStore = new MetadataStore();

export default function RouteClassFactory<T extends typeof BaseRoute>(ctor: T & { isRouteClass: boolean }, options: RouteOptions<T>) {
    return class RouteClass extends ctor {

        public static override isRouteClass: boolean = true;

        public static override readonly namespace: string = options.name as string;

        public override namespace: string = options.name as string;

        public isRouteClass: boolean = true;

        public constructor(server: BaseServer) {
            super(server);
            // @ts-expect-error yes it's read only but not during construction...
            this.unProxyfiedObject = this;

            this.createActions(this);
        }

        private createActions(proxy: this) {
            const actionSchemas = this.getSchema()?.actionSchemas || {};
            for (const key in actionSchemas) {
                if (hasOwnProperty(actionSchemas, key)) {
                    const action = new RouteAction(proxy, key, Reflect.get(actionSchemas, key));
                    metadataStore.setInstance("Action", proxy, key, action);
                }
            }
        }
    };
}
