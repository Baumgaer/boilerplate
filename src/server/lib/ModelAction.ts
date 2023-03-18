import CommonModelAction from "~common/lib/ModelAction";
import type { ModelLike } from "~server/@types/ModelClass";

export default class ModelAction<T extends ModelLike> extends CommonModelAction<T> { }
