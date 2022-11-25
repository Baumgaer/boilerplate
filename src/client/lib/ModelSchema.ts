import CommonModelSchema from "~common/lib/ModelSchema";
import type { ModelLike } from "~client/@types/ModelClass";

/**
 * @see CommonModelSchema
 */
export default class ModelSchema<T extends ModelLike> extends CommonModelSchema<T> { }
