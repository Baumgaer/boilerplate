import CommonAttributeSchema from "~common/lib/AttributeSchema";
import type { Constructor } from "type-fest";
import type BaseModel from "~common/lib/BaseModel";

export default class AttributeSchema<T extends Constructor<BaseModel>> extends CommonAttributeSchema<T> { }
