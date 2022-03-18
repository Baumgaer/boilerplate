import CommonBaseAttribute from "~common/lib/BaseAttribute";
import type BaseModel from "~client/lib/BaseModel";

export default abstract class BaseAttribute<T extends typeof BaseModel> extends CommonBaseAttribute<T> { }
