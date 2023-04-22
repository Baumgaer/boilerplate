import type { AccessRightFunc } from "~server/lib/ActionSchema";
import type BaseModel from "~server/lib/BaseModel";
import type Train from "~server/lib/Train";

export type HttpMethods = "POST" | "PUT" | "PATCH" | "DELETE" | "GET" | "OPTIONS";

export interface IMinimumRouteObject {
    descriptor: TypedPropertyDescriptor<(train: Train<typeof BaseModel>) => any>;
    accessCheck: AccessRightFunc;
}

export interface IFullRouteObject extends IMinimumRouteObject {
    method: HttpMethods;
    uri: string;
}
