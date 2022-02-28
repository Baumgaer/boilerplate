import CommonBaseAttribute from "~common/lib/BaseAttribute";
import type BaseModel from "~server/lib/BaseModel";

export default abstract class BaseAttribute<T extends BaseModel> extends CommonBaseAttribute<T> { }
