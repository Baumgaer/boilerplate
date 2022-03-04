import CommonDefaultAttribute from "~common/attributes/DefaultAttribute";
import type BaseModel from "~server/lib/BaseModel";

export default class DefaultAttribute<T extends BaseModel> extends CommonDefaultAttribute<T> { }
