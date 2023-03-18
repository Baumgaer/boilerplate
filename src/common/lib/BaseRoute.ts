import SchemaBased from "~env/lib/SchemaBased";
import type Schema from "~env/lib/Schema";

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

    public getSchema(): Schema<BaseRoute> | null {
        throw new Error("Not implemented");
    }

    public getActionSchema(_name: string): Schema<BaseRoute> | null {
        throw new Error("Not implemented");
    }

    public getRoutes() {
        return [];
    }
}
