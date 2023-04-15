import MetadataStore from "~env/lib/MetadataStore";
import SchemaBased from "~env/lib/SchemaBased";
import type ActionSchema from "~env/lib/ActionSchema";
import type RouteSchema from "~env/lib/RouteSchema";

const metadataStore = new MetadataStore();

export default class BaseRoute extends SchemaBased {

    public static override readonly unProxyfiedObject: typeof BaseRoute;

    public static readonly namespace: string;

    public readonly namespace!: string;

    /**
     * @see BaseRoute.unProxyfiedObject
     */
    public readonly unProxyfiedObject!: typeof this;

    public constructor(..._args: any[]) {
        super();
        // Nothing to do here
    }

    /**
     * Looks for the schema of the current instance and returns it
     *
     * @returns the schema of the model
     */
    public static getSchema() {
        return metadataStore.getSchema("Route", Object.getPrototypeOf(this), this.namespace);
    }

    public getSchema(): RouteSchema<typeof BaseRoute> | null {
        return (<typeof BaseRoute>this.constructor).getSchema();
    }

    public getActionSchema(_name: string): ActionSchema<typeof BaseRoute> | null {
        throw new Error("Not implemented");
    }

    public getRoutes() {
        return [];
    }
}
