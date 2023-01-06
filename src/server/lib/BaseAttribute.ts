import CommonBaseAttribute from "~common/lib/BaseAttribute";
import type { ModelLike } from "~server/@types/ModelClass";

/**
 * @see CommonBaseAttribute
 */
export default class BaseAttribute<T extends ModelLike> extends CommonBaseAttribute<T> {

    /**
     * @InheritDoc
     */
    protected override addReactivity(value: InstanceType<T>[this["name"]]) {
        return value;
    }
}
