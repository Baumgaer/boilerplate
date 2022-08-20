import CommonModelSchema from "~common/lib/ModelSchema";
import type BaseModel from "~client/lib/BaseModel";

export default class ModelSchema<T extends typeof BaseModel> extends CommonModelSchema<T> { }
