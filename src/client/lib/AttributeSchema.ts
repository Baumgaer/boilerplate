import CommonAttributeSchema from "~common/lib/AttributeSchema";
import type { ModelLike } from "~client/@types/ModelClass";

/**
 * @see CommonAttributeSchema
 */
export default class AttributeSchema<T extends ModelLike> extends CommonAttributeSchema<T> { }
