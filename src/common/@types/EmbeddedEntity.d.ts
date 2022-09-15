import type { Constructor } from "type-fest";
import type { IAttrMetadata } from "~common/@types/MetadataTypes";

export type EmbeddedEntityType<T, EE> = Constructor<RealConstructionParams<T> & {
    [key in keyof EE]: EE[key]
}, [RealConstructionParams<T>]> & EE;

export type members<T> = { [key in keyof RealConstructionParams<T>]: IAttrMetadata }
