import CommonSchema from "~common/lib/Schema";
import type { ModelLike } from "~server/@types/ModelClass";

export default abstract class Schema<T extends ModelLike> extends CommonSchema<T> { }
