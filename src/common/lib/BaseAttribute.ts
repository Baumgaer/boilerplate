import onChange from "on-change";
import { v4 as uuid } from "uuid";
import { reactive } from "vue";
import { isChangeObservable, isChangeObserved } from "~common/utils/utils";
import type { ApplyData, Options } from "on-change";
import type AttributeSchema from "~common/lib/AttributeSchema";
import type BaseModel from "~common/lib/BaseModel";

export default abstract class BaseAttribute<T extends typeof BaseModel> {

    public readonly id: string = uuid();

    public readonly owner: InstanceType<T>;

    public readonly name: keyof InstanceType<T>;

    public readonly schema: AttributeSchema<T>;

    protected readonly unProxyfiedOwner: InstanceType<T>;

    private readonly ctorName: string;

    private observedValue?: InstanceType<T>[this["name"]];

    public constructor(owner: InstanceType<T>, name: keyof InstanceType<T>, attributeSchema: AttributeSchema<T>) {
        this.owner = owner;
        this.unProxyfiedOwner = owner.unProxyfiedModel;
        this.name = name;
        this.schema = attributeSchema;
        this.ctorName = Object.getPrototypeOf(this.unProxyfiedOwner.constructor).name;
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
        if (this.musstObserveChanges(newValue)) {
            newValue = reactive(onChange(newValue, (...args) => this.changeCallback(...args), this.changeCallbackOptions));
            this.observedValue = newValue;
        } else delete this.observedValue;

        const setResult = Reflect.set(this.unProxyfiedOwner, this.name, newValue);
        if (setResult && oldValue !== newValue) this.callHook("observer:change", newValue);
        return setResult;
    }

    private changeCallback(path: (string | symbol)[], value: unknown, previousValue: unknown, applyData: ApplyData): void {
        Reflect.set(Reflect.get(this.owner, "dataModel"), this.name, this.observedValue);
        console.log(this.name, path, value, previousValue, applyData);
    }

    private musstObserveChanges(value: any) {
        return this.hasHook(["observer:add", "observer:remove"]) && isChangeObservable(value) && !isChangeObserved(value);
    }

    private hasHook(hookName: string | string[]) {
        const check = (name: string) => Boolean(Reflect.getMetadata(`${this.name}:${name}`, Object.getPrototypeOf(this.owner)));
        if (hookName instanceof Array) return hookName.some((name) => check(name));
        return check(hookName);
    }

    private callHook(name: string, value?: any) {
        const activeHookMetaKey = `${this.ctorName}:${this.name}:active${name}`;
        const hook = Reflect.getMetadata(`${this.name}:${name}`, Object.getPrototypeOf(this.owner));
        if (!hook || Reflect.getMetadata(activeHookMetaKey, this.unProxyfiedOwner)) return;

        Reflect.defineMetadata(activeHookMetaKey, true, this.unProxyfiedOwner);
        value = hook.value.call(this.owner, value);
        Reflect.defineMetadata(activeHookMetaKey, false, this.unProxyfiedOwner);

        return value;
    }
}
