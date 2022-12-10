import CommonBaseAction from "~common/lib/BaseAction";
import type { ModelLike } from "~server/@types/ModelClass";

export default class BaseAction<T extends ModelLike> extends CommonBaseAction<T> { }
