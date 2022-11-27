import DeepTypedSchema from "~env/lib/DeepTypedSchema";
import { baseTypeFuncs } from "~env/utils/schema";
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
}
