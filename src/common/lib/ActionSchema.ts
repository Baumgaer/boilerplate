import ApiClient from "~env/lib/ApiClient";
import { ActionError } from "~env/lib/Errors";
import PlainObjectSchema from "~env/lib/PlainObjectSchema";
import { isUndefined } from "~env/utils/utils";
import type { AccessRightFunc, ActionOptions, ActionOptionsPartialMetadataJson, HttpMethods } from "~env/@types/ActionSchema";
import type { ValidationResult } from "~env/@types/Errors";
import type { ModelLike } from "~env/@types/ModelClass";
import type ArgumentSchema from "~env/lib/ArgumentSchema";

export default class ActionSchema<T extends ModelLike> extends PlainObjectSchema<T> implements ActionOptions<T> {

    /**
     * @InheritDoc
     */
    declare public readonly name: string;

    /**
     * @InheritDoc
     */
    declare public readonly options: Readonly<ActionOptionsPartialMetadataJson<T>>;

    public readonly isActionSchema: boolean = true;

    /**
     * @InheritDoc
     */
    public accessRight!: AccessRightFunc;

    /**
     * @InheritDoc
     */
    public local!: boolean;

    /**
     * @InheritDoc
     */
    public httpMethod!: HttpMethods;

    /**
     * Holds the actual method which will be executed on action call
     */
    public readonly descriptor: TypedPropertyDescriptor<ActionFunction>;

    /**
     * Holds a list of all argument schemas related to the action schema
     */
    public readonly argumentSchemas: Readonly<Record<keyof InstanceType<T>, ArgumentSchema<T>>> = {} as Readonly<Record<keyof InstanceType<T>, ArgumentSchema<T>>>;

    /**
     * This is the internal state for indicating the finished construction,
     * which is always the case for arguments.
     */
    protected override _constructed: boolean = true;

    public constructor(ctor: T, name: string, options: ActionOptionsPartialMetadataJson<T>, schemas: ArgumentSchema<T>[], descriptor: TypedPropertyDescriptor<ActionFunction>) {
        super(ctor, name, options);
        for (const schema of schemas) this.setArgumentSchema(schema);
        this.setConstants(options);
        this.descriptor = descriptor;
    }

    public get() {
        return (...args: any[]) => {
            if (!this.owner) return Promise.resolve();
            return this.call(this.owner, ...args);
        };
    }

    public call(thisArg: T | InstanceType<T>, ...args: any[]) {
        const result = this.descriptor.value?.call(thisArg, ...args);
        const entries = Object.entries(this.argumentSchemas);

        const parameters = entries.filter((entry) => {
            return !entry[1].primary && !isUndefined(args[entry[1].index || 0]);
        }).map((entry) => [entry[0], args[entry[1].index || 0]]) as [string, any][];

        let id = "";
        let idParameterIndex = entries.findIndex((entry) => Boolean(entry[1].primary));
        if ("isNew" in thisArg && !thisArg.isNew()) {
            id = thisArg.getId();
        } else if (idParameterIndex > -1) {
            idParameterIndex = entries[idParameterIndex][1].index || 0;
            if (isUndefined(args[idParameterIndex])) {
                id = "";
            } else id = args[idParameterIndex];
        }

        if (!this.local) {
            const httpMethod = (this.httpMethod?.toLowerCase() || "get") as Lowercase<Exclude<ActionOptions<T>["httpMethod"], undefined>>;
            ApiClient[httpMethod]({ collectionName: thisArg.collectionName, actionName: String(this.name || ""), id, parameters });
        }

        return result || Promise.resolve();
    }

    public override setOwner(owner: T): void {
        super.setOwner(owner);

        for (const key in this.argumentSchemas) {
            if (Object.prototype.hasOwnProperty.call(this.argumentSchemas, key)) {
                const argumentSchema = this.argumentSchemas[key];
                argumentSchema.setOwner(owner);
            }
        }
    }

    public getArgumentSchema(name: string): ArgumentSchema<T> {
        return Reflect.get(this.argumentSchemas, name);
    }

    public setArgumentSchema(schema: ArgumentSchema<T>) {
        return Reflect.set(this.argumentSchemas, schema.name, schema);
    }

    /**
     * @InheritDoc
     */
    public override updateOptions(options: Partial<ActionOptionsPartialMetadataJson<T>>) {
        super.updateOptions(options);
        this.setConstants(this.options);
    }

    /**
     * @InheritDoc
     */
    public validate(value: unknown): ValidationResult {
        return this.internalValidation(value, ActionError);
    }

    /**
     * @InheritDoc
     */
    protected override setConstants(options: ActionOptionsPartialMetadataJson<T>) {
        super.setConstants(options);

        this.accessRight = options.accessRight ?? (() => false);
        this.local = Boolean(options.local);
        this.httpMethod = options.httpMethod ?? "GET";
    }
}
