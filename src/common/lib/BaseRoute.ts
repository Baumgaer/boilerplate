import SchemaBased from "~env/lib/SchemaBased";
import type ActionSchema from "~env/lib/ActionSchema";
import type RouteSchema from "~env/lib/RouteSchema";

export default class BaseRoute extends SchemaBased {

    public static override readonly unProxyfiedObject: typeof BaseRoute;

    /**
     * @see BaseRoute.unProxyfiedObject
     */
    public readonly unProxyfiedObject!: typeof this;

    public constructor(..._args: any[]) {
        super();
        // Nothing to do here
    }

    public getSchema(): RouteSchema<typeof BaseRoute> | null {
        throw new Error("Not implemented");
    }

    public getActionSchema(_name: string): ActionSchema<typeof BaseRoute> | null {
        throw new Error("Not implemented");
    }

    public getRoutes() {
        return [];
    }
}