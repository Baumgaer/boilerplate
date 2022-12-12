import MetadataStore from "~common/lib/MetadataStore";
import AttributeSchema from "~env/lib/AttributeSchema";
import ModelSchema from "~env/lib/ModelSchema";
import { hasOwnProperty, isObject, isPlainObject, pascalCase, upperFirst } from "~env/utils/utils";
import type { EmbeddedEntityType, members } from "~env/@types/EmbeddedEntity";
import type { ModelLike } from "~env/@types/ModelClass";

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
    const metadataStore = new MetadataStore();
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

    class EmbeddedEntity {

        public static readonly className: string = constructedClassName;

        public static readonly collectionName: string = "";

        public static readonly unProxyfiedModel: typeof EmbeddedEntity = this;

        public readonly className: string = constructedClassName;

        public readonly unProxyfiedModel: typeof this = this;

        public readonly collectionName: string = "";

        public constructor(params: RealConstructionParams<T>) {
            Object.assign(this, params);
        }

        public static [Symbol.hasInstance](instance: unknown): boolean {
            return this.isInstance(instance);
        }

        /**
         * Looks for the schema of the current instance and returns it
         *
         * @returns the schema of the model
         */
        public static getSchema(): ModelSchema<typeof EmbeddedEntity> | null {
            const metadataStore = new MetadataStore();
            return metadataStore.getSchema("Model", Object.getPrototypeOf(this), this.className);
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

        public isNew() {
            return true;
        }

        public getId() {
            return "";
        }

        /**
         * @see BaseModel.getSchema
         */
        public getSchema() {
            return (<typeof EmbeddedEntity>this.constructor).getSchema();
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
