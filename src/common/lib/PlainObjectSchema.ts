import * as DataTypes from "~env/lib/DataTypes";
import DeepTypedSchema from "~env/lib/DeepTypedSchema";
import { baseTypeFuncs, NumberType, StringType } from "~env/utils/schema";
import { hasOwnProperty } from "~env/utils/utils";
import type { ObjectSchemaType, SchemaTypes } from "~env/@types/AttributeSchema";
import type { IInterfaceType } from "~env/@types/MetadataTypes";
import type SchemaBased from "~env/lib/SchemaBased";
import type { Type } from "~env/utils/schema";

export default abstract class PlainObjectSchema<T extends typeof SchemaBased> extends DeepTypedSchema<T> {

    /**
     * Provides the possibility to check if a value is a plain object schema.
     * HINT: This is mainly provided to avoid import loops. You should prefer
     * the usual instanceof check if possible.
     */
    public readonly isPlainObjectSchema: boolean = true;

    /**
     * @InheritDoc
     */
    public getSchemaType(): Type {
        if (!this.schemaType) this.schemaType = this.buildSchemaType(this.rawType);
        return this.schemaType;
    }

    /**
     * @InheritDoc
     */
    protected buildPlainObjectSchemaType(type: IInterfaceType): ObjectSchemaType {
        const members: Record<string, Type> = {};
        for (const key in type.members) {
            if (hasOwnProperty(type.members, key)) {
                const member = type.members[key];

                const required = Reflect.get(member, "required");
                const isLazy = Reflect.get(member, "isLazy");
                const max = Reflect.get(member, "max") ?? Infinity;

                let min = Reflect.get(member, "min") ?? -Infinity;
                if (this.isStringType(member.type)) min = 0;

                let schemaType: SchemaTypes = baseTypeFuncs.never();
                if ("validator" in member && typeof member.validator === "string" && Reflect.get(DataTypes, member.validator)) {
                    schemaType = Reflect.get(DataTypes, member.validator)({ min, max }).schemaType;
                } else schemaType = this.buildSchemaType(member.type, false);

                if (schemaType instanceof NumberType) {
                    schemaType.gte(min);
                } else if (schemaType instanceof StringType) schemaType.min(min);

                if (schemaType instanceof NumberType) {
                    schemaType.lte(max);
                } else if (schemaType instanceof StringType) schemaType.max(max);

                if (!required) schemaType = baseTypeFuncs.optional(schemaType);
                if (isLazy) schemaType = schemaType.or(baseTypeFuncs.promise(schemaType));

                members[member.name] = schemaType;
            }
        }
        return baseTypeFuncs.object(members);
    }
}
