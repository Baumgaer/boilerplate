import type { SetOptional } from "type-fest";
import type { IRouteMetadata } from "~env/@types/MetadataTypes";
import type BaseRoute from "~env/lib/BaseRoute";

export type RouteLike = typeof BaseRoute;

export interface RouteOptions<T extends RouteLike> extends ThisType<T> {
    namespace?: string
}

export type RouteOptionsWithMetadataJson<T extends RouteLike> = RouteOptions<T> & { metadataJson: string };
export type RouteOptionsPartialMetadataJson<T extends RouteLike> = IRouteMetadata & SetOptional<RouteOptionsWithMetadataJson<T>, "metadataJson">;
