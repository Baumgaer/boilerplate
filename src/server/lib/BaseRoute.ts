import type { NextFunction, Request, Response } from "express";
import type { HttpMethods, IFullRouteObject, IMinimumRouteObject } from "~server/@types/http";
import type BaseServer from "~server/lib/BaseServer";

const registeredRoutes: Record<string, Record<string, IFullRouteObject>> = {};

export default class BaseRoute {

    public static namespace: string = "";

    public static serverClasses: (typeof BaseServer)[] = [];

    protected server: BaseServer;

    public constructor(server: BaseServer) {
        this.server = server;
    }

    public get routes() {
        const namespace = (this.constructor as typeof BaseRoute).namespace;
        return Object.keys(registeredRoutes[namespace]).map((key) => registeredRoutes[namespace][key]);
    }

    public static registerRoute(httpMethod: HttpMethods | "ALL", uri: string, methodName: string, accessCheck: () => boolean) {
        if (!registeredRoutes[this.namespace]) registeredRoutes[this.namespace] = {};
        let methods = [httpMethod];
        if (httpMethod === "ALL") methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
        for (const method of methods) {
            registeredRoutes[this.namespace][uri] = { method: (method as HttpMethods), uri, methodName, accessCheck };
        }
    }

    public handle(_request: Request, _response: Response, _next: NextFunction, _routeObject: IMinimumRouteObject) {
        // TODO
        // 1. Check access to route
        // 2. Get Data if ID is given
        // 3. Check access to asked data
        // 4. Check if action exists
        // 5. Process request Data (changes) in given action
        //      - Create new Objects (if allowed)
        //      - Update existing objects (if allowed for each attribute)
        //      - delete removed objects (if allowed)
        // 6. Commit changes to database
    }

}
