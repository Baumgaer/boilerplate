import BaseAction from "~env/lib/BaseAction";
import type { RouteLike } from "~env/@types/RouteClass";

export default abstract class <T extends RouteLike> extends BaseAction<T> { }
