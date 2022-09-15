import MetadataStore from "~common/lib/MetadataStore";
import AttributeSchema from "~env/lib/AttributeSchema";
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

export function applyMembers<T extends ModelLike>(classType: T, members: members<T>) {
    const metadataStore = new MetadataStore();

    for (const memberKey in members) {
        if (hasOwnProperty(members, memberKey)) {
            const memberType = members[memberKey];
            const attr = new AttributeSchema(classType, memberKey as any, memberType);
            metadataStore.setAttributeSchema(classType, memberKey as any, attr);
        }
    }
}

export function embeddedEntityFactory<T extends Record<string, any>>(className: string, members: members<T>, withProxy: boolean = true) {

    const constructedClassName = getClassName(className);

    class EmbeddedEntity {

        public static readonly className = constructedClassName;

        public readonly className = constructedClassName;

        public readonly unProxyfiedModel: typeof this = this;

        public constructor(params: RealConstructionParams<T>) {
            Object.assign(this, params);
        }

        public static [Symbol.hasInstance](instance: unknown): boolean {
            return this.isInstance(instance);
        }

        protected static isInstance(instance: unknown): boolean {
            if (!isObject(instance) || isPlainObject(instance)) return false;
            if (!("className" in instance) || Reflect.get(instance, "className") !== this.className) return false;
            Object.keys(members).every((key) => hasOwnProperty(instance, key));
            return true;
        }

        public isNew() {
            return true;
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
