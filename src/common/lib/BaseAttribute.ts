import onChange from "on-change";
import { v4 as uuid } from "uuid";
import { isChangeObservable, isChangeObserved } from "~common/utils/utils";
import type { ApplyData, Options } from "on-change";
import type AttributeSchema from "~common/lib/AttributeSchema";
import type BaseModel from "~common/lib/BaseModel";
import type { IAttributeChange } from "~common/types/AttributeSchema";

export default abstract class BaseAttribute<T extends typeof BaseModel> {

    public readonly id: string = uuid();

    public readonly owner: InstanceType<T>;

    public readonly name: keyof InstanceType<T>;

    public readonly schema: AttributeSchema<T>;

    protected readonly unProxyfiedOwner: InstanceType<T>;

    private readonly ownerName: string;

    private observedValue?: InstanceType<T>[this["name"]];

    private changes: IAttributeChange[] = [];

    public constructor(owner: InstanceType<T>, name: keyof InstanceType<T>, attributeSchema: AttributeSchema<T>) {
        this.owner = owner;
        this.unProxyfiedOwner = owner.unProxyfiedModel;
        this.name = name;
        this.schema = attributeSchema;
        this.ownerName = (<typeof BaseModel>Object.getPrototypeOf(this.unProxyfiedOwner.constructor)).name;
    }

    private get changeCallbackOptions(): Options & { pathAsArray: true } {
        return { isShallow: true, pathAsArray: true, details: true };
    }

    public get(): InstanceType<T>[this["name"]] {
        const hookValue = this.callHook("getter");
        return hookValue !== undefined ? hookValue : this.observedValue ?? Reflect.get(this.unProxyfiedOwner, this.name);
    }

    public set(value: InstanceType<T>[this["name"]]): boolean {
        const hookValue = this.callHook("setter", value);
        const oldValue = null; //this.observedValue ?? Reflect.get(this.dataModel, this.name);
        let newValue = hookValue !== undefined ? hookValue : value;
        if (this.mustObserveChanges(newValue)) {
            newValue = this.addReactivity(onChange(newValue, (path, value, previousValue, applyData) => {
                this.changeCallback(path, value as InstanceType<T>[this["name"]], previousValue as InstanceType<T>[this["name"]], applyData);
            }, this.changeCallbackOptions));
            this.observedValue = newValue;
        } else delete this.observedValue;

        const setResult = Reflect.set(this.unProxyfiedOwner, this.name, newValue);
        if (setResult && oldValue !== newValue) {
            this.callHook("observer:change", newValue);
            this.changes.push({ type: "change", path: [], value: newValue });
        }
        return setResult;
    }

    public hasChanges() {
        return Boolean(this.changes.length);
    }

    public getChanges() {
        return this.changes.slice();
    }

    public removeChanges() {
        this.changes = [];
    }

    public undoChanges() {
        throw new Error("Not implemented");
    }

    protected changeCallback(path: (string | symbol)[], value: InstanceType<T>[this["name"]], previousValue: InstanceType<T>[this["name"]], _applyData: ApplyData): void {
        if (this.schema.isArrayType()) {
            if (path[0] === "length") return;
            const changePath = path.slice(0, path.length);
            const index = parseInt(path[path.length - 1].toString());

            if (previousValue === undefined && value !== undefined) {
                this.callHook("observer:add", value, { path, oldValue: previousValue });
                this.changes.push({ type: "add", path: changePath, index, value });
            } else if (previousValue !== undefined && value === undefined) {
                this.callHook("observer:remove", previousValue, { path, oldValue: previousValue });
                this.changes.push({ type: "remove", path: changePath, index, value });
            } else if (previousValue !== undefined && value !== undefined) {
                this.callHook("observer:remove", previousValue, { path, oldValue: previousValue });
                this.changes.push({ type: "remove", path: changePath, index, value });
                this.callHook("observer:add", value, { path, oldValue: previousValue });
                this.changes.push({ type: "add", path: changePath, index, value });
            }
        } else {
            this.callHook("observer:change", value, { path, oldValue: previousValue });
            this.changes.push({ type: "change", path, value });
        }
    }

    protected callHook(name: string, value?: InstanceType<T>[this["name"]], parameters?: ObserverParameters<unknown>) {
        const activeHookMetaKey = `${this.ownerName}:${this.name}:active${name}`;
        const hook: any | undefined = Reflect.getMetadata(`${this.name}:${name}`, this.owner);
        if (!hook || Reflect.getMetadata(activeHookMetaKey, this.unProxyfiedOwner)) return;

        Reflect.defineMetadata(activeHookMetaKey, true, this.unProxyfiedOwner);
        value = hook.value.call(this.owner, value, parameters);
        Reflect.defineMetadata(activeHookMetaKey, false, this.unProxyfiedOwner);

        return value;
    }

    protected hasHook(hookName: string | string[]) {
        const check = (name: string) => Boolean(Reflect.getMetadata(`${this.name}:${name}`, this.owner));
        if (hookName instanceof Array) return hookName.some((name) => check(name));
        return check(hookName);
    }

    private mustObserveChanges(value: unknown): value is object {
        return this.hasHook(["observer:add", "observer:remove"]) && isChangeObservable(value) && !isChangeObserved(value);
    }

    /**
     * Adds additionally reactivity to an observable value.
     * This can be used for example to add the reactivity of a frontend framework.
     *
     * @param value the value to be reactive
     * @returns the reactivated value
     */
    protected abstract addReactivity(value: InstanceType<T>[this["name"]]): InstanceType<T>[this["name"]];
}
