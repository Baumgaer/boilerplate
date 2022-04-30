import { reactive } from "vue";
import CommonBaseAttribute from "~common/lib/BaseAttribute";
import type { ApplyData } from "on-change";
import type BaseModel from "~client/lib/BaseModel";
import type { ChangeMethodsArgs } from "~common/@types/AttributeSchema";

/**
 * @see CommonBaseAttribute
 */
export default class BaseAttribute<T extends typeof BaseModel> extends CommonBaseAttribute<T> {

    private isChangeTrigger = false;

    /**
     * @inheritdoc
     *
     * This traps the "refresh-set" of observed objects to avoid calling all
     * the setter hooks just for refreshing the UI.
     */
    public override set(value: unknown): boolean {
        if (this.isChangeTrigger) {
            this.isChangeTrigger = false;
            return true;
        }
        return super.set(value);
    }

    /**
     * @inheritdoc
     */
    protected override addReactivity(value: unknown) {
        return reactive(value as any);
    }

    /**
     * @inheritdoc
     *
     * This performs a "refresh-set" to refresh the UI after changing an
     * observed object. Necessary because the observed object will be cloned
     * so the frontend observer will never trap changes. By setting the "new"
     * value, we ensure that the UI will be refreshed and observed again.
     */
    protected override changeCallback(applyData: ApplyData, ...args: ChangeMethodsArgs<unknown>): void {
        super.changeCallback(applyData, ...args);
        if (this.schema.isArrayType()) {
            this.isChangeTrigger = true;
            Reflect.set(this.owner, this.name, args[1]);
        }
    }
}
