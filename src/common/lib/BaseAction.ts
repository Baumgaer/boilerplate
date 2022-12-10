import type { ModelLike } from "~env/@types/ModelClass";
import type ActionSchema from "~env/lib/ActionSchema";

export default class BaseAction<T extends ModelLike> {

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
    public readonly schema: ActionSchema<T>;

    /**
     * Same instance as owner but without proxy to be able to set the value
     * without change detection. Setting the value over this instance avoids
     * infinite loops.
     */
    protected readonly unProxyfiedOwner: InstanceType<T>;

    public constructor(owner: InstanceType<T>, name: keyof InstanceType<T>, attributeSchema: ActionSchema<T>) {
        this.owner = owner;
        this.unProxyfiedOwner = owner.unProxyfiedModel as InstanceType<T>;
        this.name = name;
        this.schema = attributeSchema;
    }

    public get() {
        return (...args: any[]) => this.call(this.owner, ...args);
    }

    public call(thisArg: InstanceType<T>, ...args: any[]) {
        return this.schema.call(thisArg, ...args);
    }
}
