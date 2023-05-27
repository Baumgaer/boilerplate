import BaseAction from "./BaseAction";
import type { HttpMethods } from "~server/@types/ActionSchema";
import type { RouteLike } from "~server/@types/RouteClass";
import type ActionSchema from "~server/lib/ActionSchema";

export default class RouteAction<T extends RouteLike> extends BaseAction<T> {

    public readonly httpMethod: HttpMethods;

    public constructor(owner: InstanceType<T> | T, name: string, schema: ActionSchema<T>, httpMethod: HttpMethods) {
        super(owner, name, schema);
        this.httpMethod = httpMethod;
    }

    public call(_thisArg: T | InstanceType<T>, ..._args: any[]): void {
        // coming soon
    }
}
