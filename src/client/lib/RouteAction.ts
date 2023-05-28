import CommonRouteAction from "~common/lib/RouteAction";
import type { RouteLike } from "~client/@types/RouteClass";

export default abstract class <T extends RouteLike> extends CommonRouteAction<T> { }
