import BaseAction from "./BaseAction";
import type { RouteLike } from "~server/@types/RouteClass";

export default class RouteAction<T extends RouteLike> extends BaseAction<T> {
    public call(_thisArg: T | InstanceType<T>, ..._args: any[]): void {
        // coming soon
    }
}
