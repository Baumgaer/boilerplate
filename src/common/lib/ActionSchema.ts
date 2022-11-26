import DeepTypedSchema from "~env/lib/DeepTypedSchema";
import type { ZodType, ZodTypeDef } from "zod";
import type { ActionOptions } from "~env/@types/ActionSchema";
import type { ObjectSchemaType } from "~env/@types/AttributeSchema";
import type { ValidationResult } from "~env/@types/Errors";
import type { IInterfaceType } from "~env/@types/MetadataTypes";
import type { ModelLike } from "~env/@types/ModelClass";

export default class ActionSchema<T extends ModelLike> extends DeepTypedSchema<T> implements ActionOptions<T> {

    public getSchemaType(): ZodType<any, ZodTypeDef, any> {
        throw new Error("Method not implemented.");
    }
    public validate(_value: unknown): ValidationResult {
        throw new Error("Method not implemented.");
    }

    protected buildPlainObjectSchemaType(_type: IInterfaceType, _applySettings: boolean): ObjectSchemaType {
        throw new Error("Method not implemented.");
    }
}
