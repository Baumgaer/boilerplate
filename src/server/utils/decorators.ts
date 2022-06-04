import type { HttpMethods } from "~server/@types/http";
import type BaseRoute from "~server/lib/BaseRoute";
import type BaseServer from "~server/lib/BaseServer";

export * from "~common/utils/decorators";

export function Route(servers: typeof BaseServer[], namespace: string) {
    return (target: typeof BaseRoute) => {
        target.namespace = namespace;
        target.serverClasses = servers;
    };
}

export function Action(httpMethod: HttpMethods | "ALL", uri: string, accessCheck: () => boolean) {
    return (target: typeof BaseRoute, methodName: string) => {
        target.registerRoute(httpMethod, uri, methodName, accessCheck);
    };
}
