import CommonRouteSchema from "~common/lib/RouteSchema";
import type { RouteLike } from "~server/@types/RouteClass";

/**
 * @see CommonRouteSchema
 */
export default class RouteSchema<T extends RouteLike> extends CommonRouteSchema<T> { }
