import { mergeWith } from "~env/utils/utils";
import MetadataStore from "~server/lib/MetadataStore";
import RouteClassFactory from "~server/lib/RouteClass";
import type { IRouteMetadata } from "~server/@types/MetadataTypes";
import type { RouteOptionsPartialMetadataJson, RouteOptionsWithMetadataJson, RouteOptions } from "~server/@types/RouteClass";
import type BaseRoute from "~server/lib/BaseRoute";

export * from "~common/utils/decorators";

const metadataStore = new MetadataStore();

export function Route<T extends typeof BaseRoute>(options: RouteOptions<T> = {}): ClassDecorator {
    const metadata: IRouteMetadata = JSON.parse((<RouteOptionsWithMetadataJson<T>>options).metadataJson);
    const metadataOptions: RouteOptionsPartialMetadataJson<T> = mergeWith({}, metadata, <RouteOptionsWithMetadataJson<T>>options);
    delete metadataOptions.metadataJson;

    return (target: any) => {
        const options = metadataOptions;
        const proto: typeof BaseRoute = Object.getPrototypeOf(target);

        // @ts-expect-error This is readonly to prevent setting it while normal development
        proto.namespace = options.name;

        const routeClass = RouteClassFactory(target, options);

        const actionSchemas = [...metadataStore.getSchemas("Action", target), ...metadataStore.getSchemas("Action", target.constructor)];
        for (const actionSchema of actionSchemas) actionSchema.setOwner(routeClass);
    };
}
