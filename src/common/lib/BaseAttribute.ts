import onChange from "on-change";
import { v4 as uuid } from "uuid";
import { setValue, getValue, isChangeObservable, isChangeObserved } from "~common/utils/utils";
import type { Options } from "on-change";
import type { IAttributeChange } from "~common/@types/AttributeSchema";
import type AttributeSchema from "~common/lib/AttributeSchema";
import type BaseModel from "~common/lib/BaseModel";

/**
 * Manages basic reactivity inside the model and calls hooks depending on type
 * and action performed on the attribute. It also stores all changes which
 * were ever made since the last call of save() and gives ability to undo them.
 *
 * @template T The class of the instance the attribute belongs to
 */
export default abstract class BaseAttribute<T extends typeof BaseModel> {

    /**
     * Gives ability to check identity when no class is given
     */
    public readonly id: string = uuid();

    /**
     * Holds the instance which holds the attribute. This instance is a proxy
     * which detects changes to any attribute which were made.
     */
    public readonly owner: InstanceType<T>;

    /**
     * The name of the attribute which corresponds by the attribute name in
     * the code or an alias defined in the @Attr() decorator
     */
    public readonly name: keyof InstanceType<T>;

    /**
     * The schema of the attribute which gives more information.
     */
    public readonly schema: AttributeSchema<T>;

    /**
     * Same instance as owner but without proxy to be able to set the value
     * without change detection. Setting the value over this instance avoids
     * infinite loops.
     */
    protected readonly unProxyfiedOwner: InstanceType<T>;

    /**
     * A shortcut to the owners name
     */
    private readonly ownerName: string;

    /**
     * Holds the value as a proxy of reference values to be able to compare
     * old value with new one.
     */
    private observedValue?: InstanceType<T>[this["name"]];

    /**
     * Holds an array of changes which will be collected by its owner which
     * will then send them to the server.
     */
    private changes: IAttributeChange[] = [];

    /**
     * Indicates if changes are currently processed in any way. For example
     * when undoing or applying them to avoid setting new changes during this time.
     */
    private processingChanges: boolean = false;

    public constructor(owner: InstanceType<T>, name: keyof InstanceType<T>, attributeSchema: AttributeSchema<T>) {
        this.owner = owner;
        this.unProxyfiedOwner = owner.unProxyfiedModel;
        this.name = name;
        this.schema = attributeSchema;
        this.ownerName = owner.className;
    }

    /**
     * These options corresponds to the options of the npm package on-change
     *
     * @see https://github.com/sindresorhus/on-change
     * @readonly
     */
    private get changeCallbackOptions(): Options & { pathAsArray: true } {
        return { isShallow: !this.schema.isPlainObjectType(), pathAsArray: true };
    }

    /**
     * Will be called when trying to access the attribute in any place of the
     * code. This only works when the instance where the attribute is
     * accessed on is a proxy.
     *
     * @returns the value of the actual attribute of the owner
     */
    public get(): InstanceType<T>[this["name"]] {
        const hookValue = this.callHook("getter");
        return hookValue !== undefined ? hookValue : this.observedValue ?? Reflect.get(this.unProxyfiedOwner, this.name);
    }

    /**
     * Will be called when trying to set the attributes value in any place of the
     * code. This only works when the instance where the attribute is
     * set on is a proxy.
     *
     * @param value The value which should be set on the attribute
     * @returns true if it was set and false on error
     */
    public set(value: InstanceType<T>[this["name"]]): boolean {
        let changeType: IAttributeChange["type"] = "change";
        if (this.unProxyfiedOwner[this.name] === undefined) changeType = "init";

        const hookValue = this.callHook("setter", value);
        const oldValue = this.observedValue ?? Reflect.get(this.owner, this.name);
        let newValue = hookValue !== undefined ? hookValue : value;

        if (this.mustObserveChanges(newValue)) {
            newValue = this.addReactivity(onChange(newValue, (path, value, previousValue) => {
                this.changeCallback(path, value as InstanceType<T>[this["name"]], previousValue as InstanceType<T>[this["name"]]);
            }, this.changeCallbackOptions));
            this.observedValue = newValue;
        } else delete this.observedValue;

        const setResult = Reflect.set(this.unProxyfiedOwner, this.name, newValue);
        if (setResult && oldValue !== newValue) {
            this.callHook("observer:change", newValue);
            this.addChange({ type: changeType, path: [], value: newValue, previousValue: oldValue });
        }

        return setResult;
    }

    /**
     * Checks if there are any changes on the attribute
     *
     * @returns true if there is any change and false else
     */
    public hasChanges() {
        return Boolean(this.changes.length);
    }

    /**
     * slices the changes FLAT and returns them
     *
     * @returns a copy of the changes
     */
    public getChanges() {
        return this.changes.slice();
    }

    /**
     * Just removes the changes without any other action
     */
    public removeChanges() {
        this.changes = [];
    }

    /**
     * Returns the processing state of the changes. Changes are processed
     * while they are applied or revoked.
     *
     * @returns true if changes are in process and false else
     */
    public isProcessingChanges() {
        return this.processingChanges;
    }

    /**
     * Iterates al changes in reverse way and performs for each change the
     * opposite action. When everything is revoked, all changes will be removed.
     * Changes to the attribute can not be applied while this action is running.
     */
    public undoChanges() {
        this.processingChanges = true;

        for (const change of this.getChanges().reverse()) {
            const path = [this.name].concat(change.path as this["name"][]);
            const obj = getValue(this.owner, path.slice(0, -1));
            if (change.type === "init") {
                setValue(this.owner, path, undefined);
            } else if (obj instanceof Array) {
                if (change.type === "add") {
                    obj.splice(Number(path.slice(-1)), 1);
                } else if (change.type === "remove") obj.splice(Number(path.slice(-1)), 0, change.previousValue);
            } else if (change.type === "change") setValue(this.owner, path, change.previousValue);
        }

        this.removeChanges();
        this.processingChanges = false;
    }

    /**
     * Applies all given changes to the attribute. This will modify the
     * first change in changes currently stored in the attribute.
     *
     * @param changes changes which should be applied to the attribute
     */
    public applyChanges(changes: IAttributeChange[]) {
        this.processingChanges = true;

        for (const change of changes) {
            const path = [this.name].concat(change.path as this["name"][]);
            const obj = getValue(this.owner, path.slice(0, -1));
            if (change.type === "init") {
                setValue(this.owner, path, change.value);
            } else if (obj instanceof Array) {
                if (change.type === "add") {
                    obj.splice(Number(path.slice(-1)), 0, change.value);
                } else if (change.type === "remove") obj.splice(Number(path.slice(-1)), 1);
            } else if (change.type === "change") setValue(this.owner, path, change.value);
        }

        this.processingChanges = false;
    }

    /**
     * Adds a change if attribute is currently not processed
     *
     * @param change
     */
    protected addChange(change: IAttributeChange) {
        if (this.processingChanges) return;
        this.changes.push(change);
    }

    /**
     * Will be called when the value of the attribute is an object like value
     * like plain objects, arrays, Maps, Sets and so on.
     *
     * @param path The path of the field which was set, relative to the objects root
     * @param value the value which was set
     * @param previousValue the value which was existent before
     */
    protected changeCallback(path: (string | symbol)[], value: InstanceType<T>[this["name"]], previousValue: InstanceType<T>[this["name"]]): void {
        if (this.schema.isArrayType()) {
            // We don't want to react on the length change of arrays because
            // this currently has no functionality and no hook
            if (path[0] === "length") return;
            if (previousValue === undefined && value !== undefined) {
                this.callHook("observer:add", value, { path, oldValue: previousValue });
                this.addChange({ type: "add", path, value, previousValue });
            } else if (previousValue !== undefined && value === undefined) {
                this.callHook("observer:remove", previousValue, { path, oldValue: previousValue });
                this.addChange({ type: "remove", path, value, previousValue });
            } else if (previousValue !== undefined && value !== undefined) {
                this.callHook("observer:remove", previousValue, { path, oldValue: previousValue });
                this.addChange({ type: "remove", path, value, previousValue });
                this.callHook("observer:add", value, { path, oldValue: previousValue });
                this.addChange({ type: "add", path, value, previousValue });
            }
        } else {
            let changeType: IAttributeChange["type"] = "change";
            if (getValue(this.unProxyfiedOwner[this.name], path) === undefined) changeType = "init";
            this.callHook("observer:change", value, { path, oldValue: previousValue });
            this.addChange({ type: changeType, path, value, previousValue });
        }
    }

    /**
     * Calls a hook based on its name with the given value and parameters as
     * function parameters to be passed into the hook function.
     *
     * @param name the name of the hook including the type, for example observer:change
     * @param value The value which should be passed to the hook function
     * @param parameters The parameters with which the hook is called
     * @returns the return value of the hook in case of a getter or setter
     */
    protected callHook(name: string, value?: InstanceType<T>[this["name"]], parameters?: ObserverParameters<unknown>) {
        const activeHookMetaKey = `${this.ownerName}:${this.name}:active${name}`;
        const hook: any | undefined = Reflect.getMetadata(`${this.name}:${name}`, this.owner);
        if (!hook || Reflect.getMetadata(activeHookMetaKey, this.unProxyfiedOwner)) return;

        Reflect.defineMetadata(activeHookMetaKey, true, this.unProxyfiedOwner);
        value = hook.value.call(this.owner, value, parameters);
        Reflect.defineMetadata(activeHookMetaKey, false, this.unProxyfiedOwner);

        return value;
    }

    /**
     * Checks if the owning model has the hook named by hookName
     *
     * @param hookName the name of the hook to check for
     * @returns true if the owning model has a hook and false else
     */
    protected hasHook(hookName: string | string[]) {
        const check = (name: string) => Boolean(Reflect.getMetadata(`${this.name}:${name}`, this.owner));
        if (hookName instanceof Array) return hookName.some((name) => check(name));
        return check(hookName);
    }

    /**
     * Checks if the value has to be observed, depending on it currently is
     * not observed and is observable.
     *
     * @param value the value which may be should be observed
     * @returns true if its an observable value and false else
     */
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
