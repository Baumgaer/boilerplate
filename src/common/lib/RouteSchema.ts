import ActionableSchema from "~env/lib/ActionableSchema";
import { baseTypeFuncs } from "~env/utils/schema";
import type { RouteOptions, RouteLike } from "~env/@types/RouteClass";
import type ActionSchema from "~env/lib/ActionSchema";
import type { LazyType, NeverType } from "~env/utils/schema";

export default class RouteSchema<T extends RouteLike> extends ActionableSchema<T> {

    public readonly namespace: string;

    /**
     * @InheritDoc
     */
    declare public readonly options: RouteOptions<T>;

    /**
     * @InheritDoc
     */
    protected override schemaType: LazyType<NeverType> = baseTypeFuncs.lazy(this.buildSchemaType.bind(this));

    public constructor(ctor: T, name: string, actionSchemas: ActionSchema<T>[], options: RouteOptions<T>) {
        super(ctor, name, actionSchemas, options);
        this.namespace = options.namespace as string;
    }

    public getSchemaType() {
        return this.schemaType;
    }

    public validate(_value: unknown) {
        return { success: false, errors: [] };
    }

    protected buildSchemaType() {
        return baseTypeFuncs.never();
    }
}
