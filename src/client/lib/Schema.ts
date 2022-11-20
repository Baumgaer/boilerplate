import CommonSchema from "~common/lib/Schema";
import type { ModelLike } from "~client/@types/ModelClass";

export default abstract class SchemaSchema<T extends ModelLike> extends CommonSchema<T> { }
