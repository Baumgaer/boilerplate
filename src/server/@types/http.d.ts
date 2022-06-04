export type HttpMethods = "POST" | "PUT" | "PATCH" | "DELETE" | "GET" | "OPTIONS";

export interface IMinimumRouteObject {
    methodName: string;
    accessCheck: () => boolean;
}

export interface IFullRouteObject extends IMinimumRouteObject {
    method: HttpMethods;
    uri: string;
}
