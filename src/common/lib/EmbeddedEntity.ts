import AttributeSchema from "~env/lib/AttributeSchema";
import MetadataStore from "~env/lib/MetadataStore";
import ModelSchema from "~env/lib/ModelSchema";
import ModelSchemaBased from "~env/lib/ModelSchemaBased";
import { hasOwnProperty, isObject, isPlainObject, pascalCase, upperFirst } from "~env/utils/utils";
import type { EmbeddedEntityType, members } from "~env/@types/EmbeddedEntity";
import type { ModelLike } from "~env/@types/ModelClass";

const metadataStore = new MetadataStore();

export const embeddedEntitySuffix = "EmbeddedEntity";

export function getClassName<T extends string>(className: T, environment: "common" | "client" | "server" = "common") {
    let constructedClassName = pascalCase(className);
    if (!constructedClassName.endsWith(embeddedEntitySuffix)) constructedClassName = `${constructedClassName}${embeddedEntitySuffix}`;
    if (!constructedClassName.startsWith(upperFirst(environment))) constructedClassName = `${upperFirst(environment)}${constructedClassName}`;
    return constructedClassName;
}

export function proxyfy<T, EE extends Record<string, any>>(className: string, classType: EE) {
    return new Proxy(classType, {
        get: (target, property) => property === "name" ? className : Reflect.get(target, property)
    }) as unknown as EmbeddedEntityType<T, EE>;
}

export function applyMembers<T extends ModelLike>(classType: T, members: members<Record<string, any>>) {
    const attributeSchemas: AttributeSchema<T>[] = [];
    for (const memberKey in members) {
        if (hasOwnProperty(members, memberKey)) {
            const memberType = members[memberKey];
            const attr = new AttributeSchema(classType, memberKey as any, memberType);
            attributeSchemas.push(attr);
            metadataStore.setSchema("Attribute", classType, memberKey as any, attr);
        }
    }

    const modelSchema = new ModelSchema(classType, classType.className, attributeSchemas, [], {});
    metadataStore.setSchema("Model", classType, classType.className, modelSchema);
}

export function embeddedEntityFactory<T extends Record<string, any>>(className: string, members: members<T>, withProxy: boolean = true) {

    const constructedClassName = getClassName(className);

    class EmbeddedEntity extends ModelSchemaBased {

        /**
         * @inheritdoc
         */
        public static override readonly className: string = constructedClassName;

        /**
         * @inheritdoc
         */
        public static override readonly collectionName: string = "";

        /**
         * @inheritdoc
         */
        public static override readonly unProxyfiedObject: typeof EmbeddedEntity = this;

        /**
         * @inheritdoc
         */
        public override readonly className: string = constructedClassName;

        /**
         * @inheritdoc
         */
        public override readonly unProxyfiedObject: this = this;

        /**
         * @inheritdoc
         */
        public override readonly collectionName: string = "";

        public constructor(params: RealConstructionParams<T>) {
            super(params);
            Object.assign(this, params);
        }

        public static [Symbol.hasInstance](instance: unknown): boolean {
            return this.isInstance(instance);
        }

        /**
         * @inheritdoc
         */
        public static override getSchema(): ModelSchema<typeof EmbeddedEntity> | null {
            return super.getSchema("Model", this.className);
        }

        /**
         * @inheritdoc
         */
        public static override getActionSchema(name: string) {
            return super.getActionSchema(name);
        }

        protected static isInstance(instance: unknown): boolean {
            if (!isObject(instance) || isPlainObject(instance)) return false;
            if (!("className" in instance) || Reflect.get(instance, "className") !== className) return false;

            const schema = (instance as EmbeddedEntity)?.getSchema?.();
            if (!schema || !schema.attributeSchemas || !isObject(schema.attributeSchemas)) return false;

            return Object.keys(members).every((key) => {
                return !Reflect.get(members, key).isRequired || hasOwnProperty(schema.attributeSchemas, String(key));
            });
        }

        /**
         * @inheritdoc
         */
        public override getSchema(): ModelSchema<typeof EmbeddedEntity> | null {
            return (this.constructor as typeof EmbeddedEntity).getSchema();
        }

        /**
         * @inheritdoc
         */
        public override getActionSchema(name: string) {
            return super.getActionSchema(name);
        }

    }

    if (withProxy) {
        // Manipulate the constructor name to be able to store the data in the
        // database the right way and to be able to minify the className on compile time.
        applyMembers(EmbeddedEntity as unknown as ModelLike, members as members<typeof EmbeddedEntity>);
        return proxyfy<T, typeof EmbeddedEntity>(className, EmbeddedEntity);
    }
    return EmbeddedEntity;
}
