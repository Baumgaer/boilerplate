import BaseAction from "~env/lib/BaseAction";
import type { RouteLike } from "~env/@types/RouteClass";

export default abstract class RouteAction<T extends RouteLike> extends BaseAction<T> {

    /**
     * Provides the possibility to check if a value is a route action.
     * HINT: This is mainly provided to avoid import loops. You should prefer
     * the usual instanceof check if possible.
     */
    public readonly isRouteAction: boolean = true;

}
