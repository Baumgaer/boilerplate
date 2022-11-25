import CommonArgumentSchema from "~common/lib/ArgumentSchema";
import type { ModelLike } from "~client/@types/ModelClass";

/**
 * @see CommonArgumentSchema
 */
export default class ArgumentSchema<T extends ModelLike> extends CommonArgumentSchema<T> { }
