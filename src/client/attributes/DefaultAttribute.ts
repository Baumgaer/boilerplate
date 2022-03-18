import CommonDefaultAttribute from "~common/attributes/DefaultAttribute";
import type BaseModel from "~client/lib/BaseModel";

export default class DefaultAttribute<T extends typeof BaseModel> extends CommonDefaultAttribute<T> { }
