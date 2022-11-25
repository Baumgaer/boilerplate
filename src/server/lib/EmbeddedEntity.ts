import { embeddedEntityFactory as commonEmbeddedEntityFactory, proxyfy, getClassName, applyMembers } from "~common/lib/EmbeddedEntity";
import type { EmbeddedEntityType, members } from "~server/@types/EmbeddedEntity";
import type { ModelLike } from "~server/@types/ModelClass";

/**
 * @see commonEmbeddedEntityFactory
 */
export function embeddedEntityFactory<T extends Record<string, any>>(className: string, members: members<T>) {

    className = getClassName(className, "server");

    class EmbeddedEntity extends commonEmbeddedEntityFactory(className, members, false) {
        public static override readonly className: string = className;

        public override readonly className: string = className;
    }

    applyMembers(EmbeddedEntity as unknown as ModelLike, members);
    return proxyfy<T, typeof EmbeddedEntity>(className, EmbeddedEntity) as unknown as EmbeddedEntityType<T, EmbeddedEntity>;
}
