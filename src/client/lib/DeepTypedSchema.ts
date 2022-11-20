import CommonDeepTypedSchema from "~common/lib/DeepTypedSchema";
import type { ModelLike } from "~client/@types/ModelClass";

export default abstract class DeepTypedSchema<T extends ModelLike> extends CommonDeepTypedSchema<T> { }
