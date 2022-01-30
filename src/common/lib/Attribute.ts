import type { AttrOptionsPartialMetadataJson } from "~common/types/decorators";
import type { IMetadata } from "~common/types/metadataTypes";
import { type SchemaTypeOptions, Schema } from "mongoose";
import { Constructor, ValueOf } from "type-fest";

export default class Attribute<T> implements SchemaTypeOptions<T> {

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

    constructor(cTor: Constructor<T>, attributeName: string, parameters: AttrOptionsPartialMetadataJson<T>) {
        this.required = Boolean(parameters.isRequired);
        this.immutable = Boolean(parameters.isReadOnly);

        Object.assign(this, this.calculateTypePartials(cTor, attributeName, parameters.type));
    }

    private calculateTypePartials(cTor: Constructor<T>, attributeName: string, rawType: IMetadata["type"]): Pick<SchemaTypeOptions<T>, "ref" | "enum"> & { type: ValueOf<typeof Schema.Types> | ReturnType<Attribute<T>["calculateTypePartials"]>[] } {
        if (rawType.isUnresolvedType) throw new Error(`Unresolved type detected in ${cTor.name}[${attributeName}]`);
        if (rawType.isModel) return { ref: rawType.identifier, type: Schema.Types.ObjectId };
        if (rawType.isArray) return { type: [this.calculateTypePartials(cTor, attributeName, rawType.subType)] };
        if (rawType.isMixed) return { type: Schema.Types.Mixed };
        if (rawType.isUnion && rawType.subTypes.every((subType) => subType.isNumberLiteral || subType.isStringLiteral)) {
            let enumType = Schema.Types.Mixed;
            if (rawType.subTypes.length) {
                if (rawType.subTypes.every((subType) => subType.isNumberLiteral)) enumType = Schema.Types.Number;
                if (rawType.subTypes.every((subType) => subType.isStringLiteral)) enumType = Schema.Types.String;
            } else console.log(rawType);
            return { type: enumType, enum: rawType.subTypes.map((subType) => subType.value) };
        }

        const mayType = Schema.Types[<keyof typeof Schema.Types>rawType.identifier];
        if (mayType) return { type: mayType };
        return { type: Schema.Types.Mixed };
    }
}
