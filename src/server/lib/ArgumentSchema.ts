import CommonArgumentSchema from "~common/lib/ArgumentSchema";
import type { ModelLike } from "~server/@types/ModelClass";

/**
 * @see CommonArgumentSchema
 */
export default class ArgumentSchema<T extends ModelLike> extends CommonArgumentSchema<T> { }
