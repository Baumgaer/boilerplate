import { reactive } from "vue";
import CommonBaseAttribute from "~common/lib/BaseAttribute";
import type BaseModel from "~client/lib/BaseModel";

/**
 * @see CommonBaseAttribute
 */
export default class BaseAttribute<T extends typeof BaseModel> extends CommonBaseAttribute<T> {

    /**
     * @inheritdoc
     */
    protected override addReactivity(value: InstanceType<T>[this["name"]]) {
        return reactive(value as any);
    }
}
