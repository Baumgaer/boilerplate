import CommonAttributeSchema from "~common/lib/AttributeSchema";
import MetadataStore from "~common/lib/MetadataStore";
import { hasOwnProperty, pascalCase } from "~common/utils/utils";
import type { IEmbeddedEntity } from "~client/../common/@types/AttributeSchema";
import type { IAttrMetadata } from "~client/@types/MetadataTypes";
import type BaseModel from "~client/lib/BaseModel";

/**
 * @see CommonAttributeSchema
 */
export default class AttributeSchema<T extends typeof BaseModel> extends CommonAttributeSchema<T> {

    /**
     * @inheritdoc
     */
    protected override buildEmbeddedEntity(attributeName: string, type: IAttrMetadata["type"]): IEmbeddedEntity | null {
        if (this.isArrayType(type)) type = type.subType;
        if (!this.isPlainObjectType(type)) return null;

        const metadataStore = new MetadataStore();
        const className = `${pascalCase(attributeName)}EmbeddedEntity`;
        class EmbeddedEntity {
            public static className: string = className;
        }

        for (const memberKey in type.members) {
            if (hasOwnProperty(type.members, memberKey)) {
                const memberType = type.members[memberKey];
                const attr = new AttributeSchema(EmbeddedEntity as any, memberKey, memberType);
                metadataStore.setAttributeSchema(EmbeddedEntity as any, memberKey, attr);
            }
        }

        return EmbeddedEntity;
    }
}
