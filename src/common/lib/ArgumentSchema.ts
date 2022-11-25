import DeepTypedSchema from "~env/lib/DeepTypedSchema";
import type { ArgOptionsPartialMetadataJson } from "~env/@types/ArgumentSchema";
import type { ObjectSchemaType } from "~env/@types/AttributeSchema";
import type { ValidationResult } from "~env/@types/Errors";
import type { MetadataType } from "~env/@types/MetadataTypes";
import type { ModelLike } from "~env/@types/ModelClass";
import type { Type } from "~env/utils/schema";

export default class ArgumentSchema<T extends ModelLike> extends DeepTypedSchema<T> {

    /**
     * The name of the argument in the schema. Corresponds to the argument
     * name in the action (maybe not in runtime)
     */
    declare public readonly name: keyof T;

    /**
     * @inheritdoc
     */
    declare public readonly options: Readonly<ArgOptionsPartialMetadataJson<T>>;

    /**
     * @inheritdoc
     */
    public index?: number;

    /**
     * This is the internal state for indicating the finished construction,
     * which is always the case for arguments.
     */
    protected override _constructed: boolean = true;

    public constructor(ctor: T, name: keyof T, options: ArgOptionsPartialMetadataJson<T>) {
        super(ctor, name, options);
        this.setConstants(options);
    }

    /**
     * @inheritdoc
     */
    public override updateOptions(options: Partial<ArgOptionsPartialMetadataJson<T>>) {
        super.updateOptions(options);
        this.setConstants(this.options);
    }

    /**
     * @inheritdoc
     */
    public getSchemaType(): Type {
        if (!this.schemaType) this.schemaType = this.buildSchemaType(this.rawType);
        return this.schemaType;
    }

    /**
     * @inheritdoc
     */
    public validate(_value: unknown): ValidationResult {
        throw new Error("Method not implemented.");
    }

    /**
     * @inheritdoc
     */
    protected buildPlainObjectSchemaType(_type: MetadataType, _applySettings: boolean): ObjectSchemaType {
        throw new Error("Method not implemented.");
    }

    protected override setConstants(options: ArgOptionsPartialMetadataJson<T>) {
        super.setConstants(options);
        this.index = options.index;
    }

}
