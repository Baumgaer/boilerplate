import ActionableSchemaBased from "~env/lib/ActionableSchemaBased";
import MetadataStore from "~env/lib/MetadataStore";
import RouteAction from "~env/lib/RouteAction";
import type { HttpMethods } from "~env/@types/http";
import type EnvBaseRoute from "~env/lib/BaseRoute";
import type RouteSchema from "~env/lib/RouteSchema";

const metadataStore = new MetadataStore();

export default class BaseRoute extends ActionableSchemaBased {

    public static override readonly unProxyfiedObject: typeof BaseRoute;

    public static readonly namespace: string;

    public readonly namespace!: string;

    /**
     * @see BaseRoute.unProxyfiedObject
     */
    public readonly unProxyfiedObject!: typeof this;

    public constructor(...args: any[]) {
        super(...args);
    }

    /**
     * Looks for the schema of the current instance and returns it
     *
     * @returns the schema of the model
     */
    public static override getSchema() {
        return super.getSchema("Route", this.namespace);
    }

    public static override getActionSchema(name: string, method?: HttpMethods) {
        return super.getActionSchema(name, method);
    }

    public static override getAction(name: string) {
        return super.getAction(name, RouteAction) as RouteAction<any>;
    }

    public static override getActions() {
        return super.getActions(RouteAction) as RouteAction<any>[];
    }

    public override getSchema(): RouteSchema<typeof EnvBaseRoute> | null {
        return super.getSchema("Route", this.namespace);
    }

    public override getActionSchema(name: string, method: HttpMethods = "GET") {
        return super.getActionSchema(name, method);
    }

    public override getAction(name: string, method: HttpMethods = "GET") {
        name = `${method}__:__${name}`;
        return metadataStore.getInstance<any, "Action">("Action", this, name) as RouteAction<typeof EnvBaseRoute> || null;
    }

    public override getActions() {
        return super.getActions() as RouteAction<typeof EnvBaseRoute>[];
    }

    public getRoutes() {
        const actionSchemas = this.getSchema()?.actionSchemas;
        if (!actionSchemas) return [];
        return Object.values(actionSchemas);
    }
}
