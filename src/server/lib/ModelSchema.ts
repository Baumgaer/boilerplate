import CommonModelSchema from "~common/lib/ModelSchema";
import type { ModelLike } from "~server/@types/ModelClass";

/**
 * @see CommonModelSchema
 */
export default class ModelSchema<T extends ModelLike> extends CommonModelSchema<T> { }
