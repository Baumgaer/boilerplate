import { ActionError } from "~env/lib/Errors";
import PlainObjectSchema from "~env/lib/PlainObjectSchema";
import type { AccessRightFunc, ActionOptions, ActionOptionsPartialMetadataJson } from "~env/@types/ActionSchema";
import type { ValidationResult } from "~env/@types/Errors";
import type { HttpMethods } from "~env/@types/http";
import type ArgumentSchema from "~env/lib/ArgumentSchema";
import type { BaseError } from "~env/lib/Errors";
import type SchemaBased from "~env/lib/SchemaBased";

export default class ActionSchema<T extends typeof SchemaBased> extends PlainObjectSchema<T> implements ActionOptions<T> {

    /**
     * @InheritDoc
     */
    declare public readonly name: string;

    /**
     * @InheritDoc
     */
    declare public readonly options: Readonly<ActionOptionsPartialMetadataJson<T>>;

    /**
     * Provides the possibility to check if a value is an action schema.
     * HINT: This is mainly provided to avoid import loops. You should prefer
     * the usual instanceof check if possible.
     */
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

    public constructor(ctor: T, name: string, internalName: string, options: ActionOptionsPartialMetadataJson<T>, schemas: ArgumentSchema<T>[], descriptor: TypedPropertyDescriptor<ActionFunction>) {
        super(ctor, name, internalName, options);
        for (const schema of schemas) this.setArgumentSchema(schema);
        this.setConstants(options);
        this.descriptor = descriptor;
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
    public async validate(value: unknown): Promise<ValidationResult> {
        return this.internalValidation(value, ActionError);
    }

    public async validateArguments(args: any[]): Promise<ValidationResult> {
        const errors: BaseError[] = [];

        for (const argumentSchema of Object.values(this.argumentSchemas)) {
            const validationResult = await argumentSchema.validate(args[argumentSchema.index ?? 0]);
            if (!validationResult.success) errors.push(...validationResult.errors);
        }

        return { success: !errors.length, errors };
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
