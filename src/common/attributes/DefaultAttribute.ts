import BaseAttribute from "~env/lib/BaseAttribute";
import type BaseModel from "~env/lib/BaseModel";

export default class DefaultAttribute<T extends typeof BaseModel> extends BaseAttribute<T> { }
