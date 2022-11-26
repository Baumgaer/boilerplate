import CommonSchema from "~common/lib/Schema";
import type { ModelLike } from "~client/@types/ModelClass";

/**
 * @see CommonSchema
 */
export default abstract class Schema<T extends ModelLike> extends CommonSchema<T> { }
