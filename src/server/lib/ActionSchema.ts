import CommonActionSchema from "~common/lib/ActionSchema";
import type { ModelLike } from "~server/@types/ModelClass";

export default class ActionSchema<T extends ModelLike> extends CommonActionSchema<T> { }
