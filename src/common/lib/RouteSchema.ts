import ActionableSchema from "~env/lib/ActionableSchema";
import { baseTypeFuncs } from "~env/utils/schema";
import type { ValidationResult } from "~env/@types/Errors";
import type { RouteOptions, RouteLike } from "~env/@types/RouteClass";
import type { HttpMethods } from "~env/@types/http";
import type ActionSchema from "~env/lib/ActionSchema";
import type { LazyType, NeverType } from "~env/utils/schema";

export default class RouteSchema<T extends RouteLike> extends ActionableSchema<T> {

    declare public readonly name: never;

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
        super(ctor, name, ctor.name, actionSchemas, options);
        this.namespace = options.namespace as string;
    }

    public override getActionSchema(name: string, method: HttpMethods = "GET"): ActionSchema<T> | null {
        name = `${method}__:__${String(name)}`;
        return Reflect.get(this.actionSchemas, name) || null;
    }

    public override setActionSchema(schema: ActionSchema<T>) {
        const name = `${schema.httpMethod}__:__${String(schema.name)}`;
        return Reflect.set(this.actionSchemas, name, schema);
    }

    public getSchemaType() {
        return this.schemaType;
    }

    public async validate(_value: unknown): Promise<ValidationResult> {
        return { success: false, errors: [] };
    }

    protected buildSchemaType() {
        return baseTypeFuncs.never();
    }
}
