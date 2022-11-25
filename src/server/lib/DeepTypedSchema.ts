import CommonDeepTypedSchema from "~common/lib/DeepTypedSchema";
import type { ModelLike } from "~server/@types/ModelClass";

/**
 * @see CommonDeepTypedSchema
 */
export default abstract class DeepTypedSchema<T extends ModelLike> extends CommonDeepTypedSchema<T> { }
