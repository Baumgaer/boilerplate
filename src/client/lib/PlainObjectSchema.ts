import CommonPlainObjectSchema from "~common/lib/PlainObjectSchema";
import type { ModelLike } from "~client/@types/ModelClass";

export default abstract class PlainObjectSchema<T extends ModelLike> extends CommonPlainObjectSchema<T> { }
