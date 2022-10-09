import onChange from "on-change";
import { v4 as uuid } from "uuid";
import { AttributeError } from "~env/lib/Errors";
import { setValue, getValue, isChangeObservable, isChangeObserved, isArray, isPlainObject } from "~env/utils/utils";
import type { Options, ApplyData } from "on-change";
import type { ChangeMethodsArgs, IAttributeChange } from "~env/@types/AttributeSchema";
import type { ModelLike } from "~env/@types/ModelClass";
import type AttributeSchema from "~env/lib/AttributeSchema";

/**
 * Manages basic reactivity inside the model and calls hooks depending on type
 * and action performed on the attribute. It also stores all changes which
 * were ever made since the last call of save() and gives ability to undo them.
 *
 * @template T The class of the instance the attribute belongs to
 */
export default abstract class BaseAttribute<T extends ModelLike> {

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
        this.unProxyfiedOwner = owner.unProxyfiedModel as InstanceType<T>;
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
        return hookValue !== undefined ? hookValue : Reflect.get(this.unProxyfiedOwner, this.name);
    }

    /**
     * Will be called when trying to set the attributes value in any place of the
     * code. This only works when the instance where the attribute is
     * set on is a proxy.
     *
     * @param value The value which should be set on the attribute
     * @returns true if it was set and false on error
     */
    public set(value: unknown): boolean {
        let changeType: IAttributeChange["type"] = "change";
        if (this.unProxyfiedOwner[this.name] === undefined) changeType = "init";

        const hookValue = this.callHook("setter", value);
        const oldValue = Reflect.get(this.owner, this.name);
        const newValue = this.observeChangesOf(hookValue !== undefined ? hookValue : value);

        const setResult = Reflect.set(this.unProxyfiedOwner, this.name, newValue);
        if (setResult && oldValue !== newValue) {
            this.callHook("observer:change", newValue, { path: [], oldValue });
            this.addChange({ type: changeType, path: [], value: newValue, previousValue: oldValue });
        }

        return setResult;
    }

    /**
     * Creates an on-change observer if the given value is observable
     *
     * @param value the value to observe changes
     * @returns the original value if not observable and a proxyfied value else
     */
    public observeChangesOf(value: unknown) {
        let newValue = value;
        if (this.mustObserveChanges(newValue)) {
            newValue = this.addReactivity(onChange(newValue, (path, value, previousValue, applyData) => {
                this.changeCallback(applyData, path, value, previousValue);
            }, this.changeCallbackOptions));
        }
        return newValue;
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
                const index = Number(path.slice(-1));
                if (change.type === "add") {
                    obj.splice(index, 0, change.value);
                    this.adjustArrayChanges("increment", index);
                } else if (change.type === "remove") {
                    obj.splice(index, 1);
                    this.adjustArrayChanges("decrement", index);
                }
            } else if (change.type === "change") setValue(this.owner, path, change.value);
        }

        this.processingChanges = false;
    }

    /**
     * Checks if the given value is a valid value like defined by the schema
     *
     * @param value the value to check
     * @returns true if the value is valid and an error else
     */
    public validate(value: unknown) {
        if (!this.owner.isNew() && this.schema.isImmutable) {
            return new AggregateError([new AttributeError(this.name.toString(), "immutable", [], value)]);
        }
        return this.schema.validate(value);
    }

    /**
     * Adds a change if attribute is currently not processed
     *
     * @param change
     */
    protected addChange(change: IAttributeChange, isTransformed = false) {
        if (this.processingChanges) return;
        if (["init", "change"].includes(change.type) && (isArray(change.value) || isPlainObject(change.value)) && !isTransformed) {
            if (isArray(change.value)) {
                this.addChange({ type: change.type, path: change.path, value: [], previousValue: change.previousValue }, true);
                for (let index = 0; index < change.value.length; index++) {
                    const element = change.value[index];
                    this.addChange({ type: "add", path: [String(index)], value: element, previousValue: undefined }, true);
                }
            }
            if (isPlainObject(change.value)) {
                this.addChange({ type: change.type, path: change.path, value: Object.assign({}, change.value), previousValue: change.previousValue }, true);
            }
            return;
        }
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
    protected changeCallback(applyData: ApplyData, ...args: ChangeMethodsArgs<unknown>): void {
        const [path, value, previousValue] = args;
        if (this.schema.isArrayType()) {
            if (applyData) {
                const changes = this.determineArrayChanges(applyData, path, value, previousValue);
                for (const change of changes) this.processArrayChange.call(this, ...change);
            } else this.processArrayChange(path, value, previousValue);
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
    protected callHook(name: string, value?: unknown, parameters?: ObserverParameters<unknown>) {
        const activeHookMetaKey = `${this.ownerName}:${String(this.name)}:active${name}`;
        const hook: any | undefined = Reflect.getMetadata(`${String(this.name)}:${name}`, this.owner);
        if (!hook || Reflect.getMetadata(activeHookMetaKey, this.unProxyfiedOwner)) return;

        Reflect.defineMetadata(activeHookMetaKey, true, this.unProxyfiedOwner);
        value = hook.value.call(this.owner, value, parameters);
        Reflect.defineMetadata(activeHookMetaKey, false, this.unProxyfiedOwner);

        return value;
    }

    /**
     * Adjust changes of arrays when new changes are applied to ensure indexes
     * and model version to be consistent.
     *
     * @private
     * @param type wether to increase or decrease the index of existing changes
     * @param index indexes greater this index have to be adjusted
     */
    private adjustArrayChanges(type: "increment" | "decrement", index: number): void {
        for (const change of this.changes) {
            if (!["add", "remove"].includes(change.type)) continue;
            const idx = Number(!isNaN(parseInt(change.path.slice(-1).toString())) && change.path.slice(-1));
            if (type === "increment" && idx >= index) {
                change.path[change.path.length - 1] = String(idx + 1);
            } else if (type === "decrement" && idx >= index) change.path[change.path.length - 1] = String(idx - 1);
        }
    }

    /**
     * Produces normalized changes for arrays from a local view of the attribute (the array)
     *
     * @param applyData information given by on-change which method was called with which parameters
     * @param args the path as array, the new value and the old value of the attribute
     * @returns an array of new path, new value and new previous value from local view of the array
     */
    private determineArrayChanges(applyData: ApplyData, ...args: ChangeMethodsArgs<unknown>): ChangeMethodsArgs<unknown>[] {
        const [path, _value, previousValue] = args as unknown as ChangeMethodsArgs<unknown[]>;
        const changes: ChangeMethodsArgs<unknown>[] = [];
        const oldLength = Number(previousValue.length);

        const method = applyData.name as keyof [];
        if (method === "pop") { // removes behind
            changes.push([path.concat(String(oldLength - 1)), undefined, previousValue[oldLength - 1]]); // triggers remove
        } else if (method === "shift") { // removes in front
            changes.push([path.concat(["0"]), undefined, previousValue[0]]); // triggers remove
        } else if (method === "push") { // adds behind
            for (let index = 0; index < applyData.args.length; index++) {
                const arg = applyData.args[index];
                changes.push([path.concat(String(oldLength + index)), arg, undefined]); // triggers add
            }
        } else if (method === "unshift") { // adds in front
            for (let index = 0; index < applyData.args.length; index++) {
                const arg = applyData.args[index];
                changes.push([path.concat(String(index)), arg, undefined]); // triggers add
            }
        } else if (method === "copyWithin") { // copies range to index and overwrites existing values
            const args = applyData.args as Parameters<[]["copyWithin"]>;
            const elementsToAdd = previousValue.slice(args[1], args[2] ?? oldLength);
            const elementsToRemove = previousValue.slice(args[0], elementsToAdd.length);

            for (let index = 0; index < elementsToAdd.length; index++) {
                if (elementsToRemove[index]) changes.push([path.concat([String(args[0] + index)]), undefined, elementsToRemove[index]]); // triggers remove
                changes.push([path.concat([String(args[0] + index)]), elementsToAdd[index], undefined]); // triggers add
            }
        } else if (method === "fill") { // fills in range and overwrites
            const args = applyData.args as Parameters<[]["fill"]>;
            const elementsToAdd = previousValue.slice(args[1], args[2]).fill(...args);
            const elementsToRemove = previousValue.slice(args[1], elementsToAdd.length);

            for (let index = 0; index < elementsToAdd.length; index++) {
                if (elementsToRemove[index]) changes.push([path.concat([String(args[1] || 0 + index)]), undefined, elementsToRemove[index]]); // triggers remove
                changes.push([path.concat([String(args[1] || 0 + index)]), args[0], undefined]); // triggers add
            }
        } else if (method === "splice") { // removes in range and adds starting at range start
            const args = applyData.args as Parameters<[]["splice"]>;
            const elementsToAdd = args.length > 2 ? args.slice(2) : [];
            const elementsToRemove = previousValue.slice(args[0], args[0] + Number(args[1] ?? oldLength));

            for (let index = 0; index < elementsToRemove.length; index++) {
                changes.push([path.concat([String(args[0] + index)]), undefined, elementsToRemove[index]]); // triggers remove
            }

            for (let index = 0; index < elementsToAdd.length; index++) {
                changes.push([path.concat([String(args[0] + index)]), elementsToAdd[index], undefined]); // triggers add
            }
        }
        return changes;
    }

    /**
     * Triggers the corresponding hook for the change and registers the change
     * in the changes array
     *
     * @param args the path as array, the new value and the old value of the attribute
     */
    private processArrayChange(...args: ChangeMethodsArgs<unknown>) {
        const [path, value, previousValue] = args;
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
    }

    /**
     * Checks if the value has to be observed, depending on it currently is
     * not observed and is observable.
     *
     * @param value the value which may be should be observed
     * @returns true if its an observable value and false else
     */
    private mustObserveChanges(value: unknown): value is object {
        return (this.schema.isArrayType() || this.schema.isPlainObjectType()) && isChangeObservable(value) && !isChangeObserved(value);
    }

    /**
     * Adds additionally reactivity to an observable value.
     * This can be used for example to add the reactivity of a frontend framework.
     *
     * @param value the value to be reactive
     * @returns the reactivated value
     */
    protected abstract addReactivity(value: unknown): typeof value;
}
