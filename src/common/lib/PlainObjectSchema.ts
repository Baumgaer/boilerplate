import DeepTypedSchema from "~env/lib/DeepTypedSchema";
import { baseTypeFuncs, NumberType, StringType } from "~env/utils/schema";
import { hasOwnProperty } from "~env/utils/utils";
import type { ObjectSchemaType } from "~env/@types/AttributeSchema";
import type { IInterfaceType } from "~env/@types/MetadataTypes";
import type { ModelLike } from "~env/@types/ModelClass";
import type { Type } from "~env/utils/schema";

export default abstract class PlainObjectSchema<T extends ModelLike> extends DeepTypedSchema<T> {

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
                let schemaType = this.buildSchemaType(member.type, false);

                let min = -Infinity;
                if (this.isStringType(member.type)) min = 0;
                if (this.min !== undefined) min = this.min;
                if (schemaType instanceof NumberType) {
                    schemaType.gte(min);
                } else if (schemaType instanceof StringType) schemaType.min(min);

                let max = Infinity;
                if (this.max !== undefined) max = this.max;
                if (schemaType instanceof NumberType) {
                    schemaType.lte(max);
                } else if (schemaType instanceof StringType) schemaType.max(max);

                if (!Reflect.get(member.type, "required")) schemaType = baseTypeFuncs.optional(schemaType);
                if (Reflect.get(member.type, "isLazy")) schemaType = schemaType.or(baseTypeFuncs.promise(schemaType));

                members[member.name] = schemaType;
            }
        }
        return baseTypeFuncs.object(members);
    }
}
