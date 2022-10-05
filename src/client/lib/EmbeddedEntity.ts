import { embeddedEntityFactory as commonEmbeddedEntityFactory, proxyfy, getClassName, applyMembers } from "~common/lib/EmbeddedEntity";
import type { EmbeddedEntityType, members } from "~client/@types/EmbeddedEntity";
import type { ModelLike } from "~client/@types/ModelClass";

export function embeddedEntityFactory<T extends Record<string, any>>(className: string, members: members<T>) {

    className = getClassName(className, "client");

    class EmbeddedEntity extends commonEmbeddedEntityFactory(className, members, false) {
        public static override readonly className: string = className;

        public override readonly className: string = className;

    }

    applyMembers(EmbeddedEntity as unknown as ModelLike, members);
    return proxyfy<T, typeof EmbeddedEntity>(className, EmbeddedEntity) as unknown as EmbeddedEntityType<T, EmbeddedEntity>;
}
