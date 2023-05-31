import { ParameterError } from "~env/lib/Errors";
import PlainObjectSchema from "~env/lib/PlainObjectSchema";
import type { ArgOptionsPartialMetadataJson, ArgOptions } from "~env/@types/ArgumentSchema";
import type { ValidationResult } from "~env/@types/Errors";
import type SchemaBased from "~env/lib/SchemaBased";

export default class ArgumentSchema<T extends typeof SchemaBased> extends PlainObjectSchema<T> implements ArgOptions<T> {

    /**
     * The name of the argument in the schema. Corresponds to the argument
     * name in the action (maybe not in runtime)
     */
    declare public readonly name: string;

    /**
     * @InheritDoc
     */
    declare public readonly options: Readonly<ArgOptionsPartialMetadataJson<T>>;

    public readonly isArgumentSchema: boolean = true;

    /**
     * @InheritDoc
     */
    public index?: number;

    /**
     * @inheritdoc
     */
    public kind: ArgOptions<T>["kind"];

    /**
     * This is the internal state for indicating the finished construction,
     * which is always the case for arguments.
     */
    protected override _constructed: boolean = true;

    public constructor(ctor: T, name: string, internalName: string, options: ArgOptionsPartialMetadataJson<T>) {
        super(ctor, name, internalName, options);
        this.setConstants(options);
    }

    /**
     * @InheritDoc
     */
    public override updateOptions(options: Partial<ArgOptionsPartialMetadataJson<T>>) {
        super.updateOptions(options);
        this.setConstants(this.options);
    }

    /**
     * @InheritDoc
     */
    public validate(value: unknown): ValidationResult {
        return this.internalValidation(value, ParameterError);
    }

    /**
     * @InheritDoc
     */
    protected override setConstants(options: ArgOptionsPartialMetadataJson<T>) {
        super.setConstants(options);

        this.index = options.index;
        this.kind = options.kind ?? "match";
    }

}
