import CommonAttributeSchema from "~common/lib/AttributeSchema";
import MetadataStore from "~common/lib/MetadataStore";
import { hasOwnProperty, pascalCase } from "~common/utils/utils";
import type BaseModel from "~client/lib/BaseModel";
import type { IMetadata } from "~client/types/MetadataTypes";

export default class AttributeSchema<T extends typeof BaseModel> extends CommonAttributeSchema<T> {

    protected override buildEmbeddedEntity(attributeName: string, type: IMetadata["type"]) {
        if (!this.isPlainObjectType(type)) return null;
        if (this.isArrayType(type)) type = type.subType;

        const metadataStore = new MetadataStore();
        const className = `${pascalCase(attributeName)}EmbeddedEntity`;
        class EmbeddedEntity {
            public static className: string = className;
        }

        for (const memberKey in type.members) {
            if (hasOwnProperty(type.members, memberKey)) {
                const memberType = type.members[memberKey];
                const attr = new AttributeSchema(EmbeddedEntity as any, memberKey as any, memberType);
                metadataStore.setAttributeSchema(EmbeddedEntity as any, memberKey as any, attr);
            }
        }

        return EmbeddedEntity;
    }
}
