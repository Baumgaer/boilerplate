import CommonAttributeSchema from "~common/lib/AttributeSchema";
import type { ModelLike } from "~server/@types/ModelClass";

/**
 * @see CommonAttributeSchema
 */
export default class AttributeSchema<T extends ModelLike> extends CommonAttributeSchema<T> { }
