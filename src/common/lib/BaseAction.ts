import type ActionSchema from "~env/lib/ActionSchema";
import type SchemaBased from "~env/lib/SchemaBased";

export default abstract class BaseAction<T extends typeof SchemaBased> {

    /**
     * Holds the instance which holds the attribute. This instance is a proxy
     * which detects changes to any attribute which were made.
     */
    public readonly owner: T | InstanceType<T>;

    /**
     * The name of the attribute which corresponds by the attribute name in
     * the code or an alias defined in the @Attr() decorator
     */
    public readonly name: string;

    /**
     * The schema of the attribute which gives more information.
     */
    public readonly schema: ActionSchema<T>;

    /**
     * Same instance as owner but without proxy to be able to set the value
     * without change detection. Setting the value over this instance avoids
     * infinite loops.
     */
    protected readonly unProxyfiedOwner: T | InstanceType<T>;

    public constructor(owner: T | InstanceType<T>, name: string, schema: ActionSchema<T>) {
        this.owner = owner;
        this.unProxyfiedOwner = owner.unProxyfiedObject as T | InstanceType<T>;
        this.name = name;
        this.schema = schema;
    }

    public get() {
        return (...args: any[]) => this.call(this.owner, ...args);
    }

    public abstract call(thisArg: T | InstanceType<T>, ...args: any[]): Promise<any>;

}
