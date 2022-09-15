import type { members as commonMembers, EmbeddedEntityType as CommonEmbeddedEntityType } from "~common/@types/EmbeddedEntity";

export type members<T> = commonMembers<T>;

export type EmbeddedEntityType<T, EE> = CommonEmbeddedEntityType<T, EE>;
