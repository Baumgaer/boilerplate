import CommonAttributeSchema from "~common/lib/AttributeSchema";
import type BaseModel from "~common/lib/BaseModel";

export default class AttributeSchema<T extends typeof BaseModel> extends CommonAttributeSchema<T> { }
