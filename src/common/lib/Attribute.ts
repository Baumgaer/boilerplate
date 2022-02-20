import { merge } from 'lodash';
import type { AttrOptionsPartialMetadataJson } from "~common/types/Decorators";
import type { IMetadata } from "~common/types/MetadataTypes";
import { type SchemaTypeOptions, type SchemaDefinition, type SchemaDefinitionType, Schema, type SchemaDefinitionProperty } from "mongoose";
import type { Constructor } from "type-fest";
import type BaseModel from "./BaseModel";
import { isValue } from "~common/utils/utils";
import type { CalculatedType } from "~common/types/Attribute";

export default class Attribute<T extends Constructor<BaseModel>> implements SchemaTypeOptions<T> {

    public alias?: SchemaTypeOptions<T>["alias"];

    public cast?: SchemaTypeOptions<T>["cast"];

    public required?: SchemaTypeOptions<T>["required"];

    public ref?: SchemaTypeOptions<T>["ref"];

    public select?: SchemaTypeOptions<T>["select"];

    public index?: SchemaTypeOptions<T>["index"];

    public unique?: SchemaTypeOptions<T>["unique"];

    public immutable?: SchemaTypeOptions<T>["immutable"];

    public sparse?: SchemaTypeOptions<T>["sparse"];

    public text?: SchemaTypeOptions<T>["text"];

    public enum?: SchemaTypeOptions<T>["enum"];

    public subtype?: SchemaTypeOptions<T>["subtype"];

    public min?: SchemaTypeOptions<T>["min"];

    public max?: SchemaTypeOptions<T>["max"];

    public expires?: SchemaTypeOptions<T>["expires"];

    public excludeIndexes?: SchemaTypeOptions<T>["excludeIndexes"];

    public of?: SchemaTypeOptions<T>["of"];

    public auto?: SchemaTypeOptions<T>["auto"];

    public match?: SchemaTypeOptions<T>["match"];

    public lowercase?: SchemaTypeOptions<T>["lowercase"];

    public trim?: SchemaTypeOptions<T>["trim"];

    public uppercase?: SchemaTypeOptions<T>["uppercase"];

    public minlength?: SchemaTypeOptions<T>["minlength"];

    public maxlength?: SchemaTypeOptions<T>["maxlength"];

    public isInternal: boolean = false;

    public readonly parameters: AttrOptionsPartialMetadataJson<T>;

    private ctor: T;

    private attributeName: string;

    public constructor(ctor: T, attributeName: string, parameters: AttrOptionsPartialMetadataJson<T>) {
        this.ctor = ctor;
        this.attributeName = attributeName;
        this.parameters = parameters;
        this.setConstants(parameters);
        this.assignType(parameters.type);
    }

    public updateParameters(parameters: AttrOptionsPartialMetadataJson<T>) {
        merge(this.parameters, parameters);
        this.setConstants(parameters);
        this.assignType(parameters.type);
    }

    public toSchemaPropertyDefinition() {
        const forbiddenKeys = ["ctor", "attributeName", "parameters"];
        const propertyDefinition: Record<string, SchemaDefinitionProperty<T>> = {};
        for (const key of Object.getOwnPropertyNames(this)) {
            const value = Reflect.get(this, key);
            if (isValue(value) && !forbiddenKeys.includes(key)) propertyDefinition[key] = value;
        }
        return propertyDefinition;
    }

    private setConstants(parameters: AttrOptionsPartialMetadataJson<T>) {
        this.required = Boolean(parameters.isRequired);
        this.immutable = Boolean(parameters.isReadOnly);
        this.isInternal = Boolean(parameters.isInternal);
    }

    private assignType(type: IMetadata["type"]) {
        Object.assign(this, this.calculateTypePartials(this.ctor, this.attributeName, type));
    }

    private calculateTypePartials(ctor: T, attributeName: string, rawType: IMetadata["type"]): CalculatedType<T> {
        // TODO:
        //      1. Determine "of" in case of Map
        if (rawType.isUnresolvedType) throw new Error(`Unresolved type detected in ${(<any>ctor).name}[${attributeName}]`);
        if (rawType.isModel) return { ref: rawType.identifier, type: Schema.Types.ObjectId };
        if (rawType.isArray) return { type: [this.calculateTypePartials(ctor, attributeName, rawType.subType)] };
        if (rawType.isMixed) return { type: Schema.Types.Mixed };
        if (rawType.isUnion && rawType.subTypes.every((subType) => subType.isNumberLiteral || subType.isStringLiteral)) {
            let enumType = Schema.Types.Mixed;
            if (rawType.subTypes.length) {
                if (rawType.subTypes.every((subType) => subType.isNumberLiteral)) enumType = Schema.Types.Number;
                if (rawType.subTypes.every((subType) => subType.isStringLiteral)) enumType = Schema.Types.String;
            } else console.log(rawType);
            return { type: enumType, enum: rawType.subTypes.map((subType) => subType.value) };
        }
        if (rawType.isInterface) {
            const members: Record<string, CalculatedType<T>> = {};
            for (const key in rawType.members) {
                if (Object.prototype.hasOwnProperty.call(rawType.members, key)) {
                    const member = rawType.members[key];
                    members[key] = this.calculateTypePartials(ctor, attributeName, member);
                }
            }
            return { type: new Schema(<SchemaDefinition<SchemaDefinitionType<T>>>members) };
        }

        const mayType = Schema.Types[<keyof typeof Schema.Types>rawType.identifier];
        if (mayType) return { type: mayType };
        return { type: Schema.Types.Mixed };
    }
}
