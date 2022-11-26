import DeepTypedSchema from "~env/lib/DeepTypedSchema";
import { ParameterError } from "~env/lib/Errors";
import { baseTypeFuncs } from "~env/utils/schema";
import { hasOwnProperty } from "~env/utils/utils";
import type { ArgOptionsPartialMetadataJson, ArgOptions } from "~env/@types/ArgumentSchema";
import type { ObjectSchemaType } from "~env/@types/AttributeSchema";
import type { ValidationResult } from "~env/@types/Errors";
import type { IInterfaceType } from "~env/@types/MetadataTypes";
import type { ModelLike } from "~env/@types/ModelClass";
import type { Type } from "~env/utils/schema";

export default class ArgumentSchema<T extends ModelLike> extends DeepTypedSchema<T> implements ArgOptions<T> {

    /**
     * The name of the argument in the schema. Corresponds to the argument
     * name in the action (maybe not in runtime)
     */
    declare public readonly name: string;

    /**
     * @inheritdoc
     */
    declare public readonly options: Readonly<ArgOptionsPartialMetadataJson<T>>;

    public readonly isArgumentSchema: boolean = true;

    /**
     * @inheritdoc
     */
    public index?: number;

    /**
     * This is the internal state for indicating the finished construction,
     * which is always the case for arguments.
     */
    protected override _constructed: boolean = true;

    public constructor(ctor: T, name: string, options: ArgOptionsPartialMetadataJson<T>) {
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
    public validate(value: unknown): ValidationResult {
        return this.internalValidation(value, ParameterError);
    }

    /**
     * @inheritdoc
     */
    protected buildPlainObjectSchemaType(type: IInterfaceType, _applySettings: boolean): ObjectSchemaType {
        const members: Record<string, Type> = {};
        for (const key in type.members) {
            if (hasOwnProperty(type.members, key)) {
                const member = type.members[key];
                members[member.name] = this.buildSchemaType(member.type);
            }
        }
        return baseTypeFuncs.object(members);
    }

    /**
     * @inheritdoc
     */
    protected override setConstants(options: ArgOptionsPartialMetadataJson<T>) {
        super.setConstants(options);
        this.index = options.index;
    }

}
