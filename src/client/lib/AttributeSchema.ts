import CommonAttributeSchema from "~common/lib/AttributeSchema";
import type BaseModel from "~client/lib/BaseModel";

/**
 * @see CommonAttributeSchema
 */
export default class AttributeSchema<T extends typeof BaseModel> extends CommonAttributeSchema<T> { }
