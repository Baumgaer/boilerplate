import { reactive } from "vue";
import CommonBaseAttribute from "~common/lib/BaseAttribute";
import type { ApplyData } from "on-change";
import type { ChangeMethodsArgs } from "~client/@types/AttributeSchema";
import type { ModelLike } from "~client/@types/ModelClass";

/**
 * @see CommonBaseAttribute
 */
export default class BaseAttribute<T extends ModelLike> extends CommonBaseAttribute<T> {

    private isChangeTrigger: boolean = false;

    /**
     * @InheritDoc
     *
     * This traps the "refresh-set" of observed objects to avoid calling all
     * the setter hooks just for refreshing the UI.
     */
    public override set(value: unknown, currentActionName?: string): boolean {
        if (this.isChangeTrigger) {
            this.isChangeTrigger = false;
            return true;
        }
        return super.set(value, currentActionName);
    }

    /**
     * @InheritDoc
     */
    protected override addReactivity(value: unknown) {
        return reactive(value as any);
    }

    /**
     * @InheritDoc
     *
     * This performs a "refresh-set" to refresh the UI after changing an
     * observed object. Necessary because the observed object will be cloned
     * so the frontend observer will never trap changes. By setting the "new"
     * value, we ensure that the UI will be refreshed and observed again.
     */
    protected override changeCallback(applyData: ApplyData, ...args: ChangeMethodsArgs<unknown>): void {
        super.changeCallback(applyData, ...args);
        this.isChangeTrigger = true;
        Reflect.set(this.owner, this.name, Reflect.get(this.owner, this.name));
    }
}
