import type { NextFunction, Request, Response } from "express";
import type EnvBaseModel from "~env/lib/BaseModel";
import type { HttpMethods } from "~server/@types/http";

export default class Train<T extends typeof EnvBaseModel> {

    public head: InstanceType<T> | null;

    public tail: InstanceType<T>[] = [];

    private request: Request;

    private response: Response;

    private nextFunction: NextFunction;

    private _user: any | null;

    public constructor(request: Request, response: Response, next: NextFunction, objects?: InstanceType<T>[]) {
        this.request = request;
        this.response = response;
        this.nextFunction = next;
        this.tail = objects ?? [];
        this.head = this.tail.shift() ?? null;
    }

    public get user() {
        // @ts-expect-error TODO ts-expect-error has to be removed later
        return this._user ?? this.request.user;
    }

    public get session() {
        return this.request.session;
    }

    public get sessionId() {
        return this.request.sessionID;
    }

    public get ip() {
        return this.request.ip;
    }

    public get body() {
        return this.request.body;
    }

    public get query() {
        return this.request.query;
    }

    public get params() {
        return this.request.params;
    }

    public get headers() {
        return this.request.headers;
    }

    public get cookies() {
        return this.request.cookies;
    }

    public get httpMethod() {
        return this.request.method as HttpMethods;
    }

    public get url() {
        return new URL(this.request.url, `${this.request.protocol}://${this.request.headers.host}`);
    }

    public get urlString() {
        return this.request.url;
    }

    public get originalUrl() {
        return this.request.originalUrl;
    }

    public isAllowed(actionName: string) {
        return Boolean(this.head?.isAllowed(actionName, this.user));
    }

    public setUser(user: EnvBaseModel) {
        this._user = user;
    }

    public resetUser() {
        this._user = null;
    }

    public setHead(object: InstanceType<T>) {
        const objectIndex = this.tail.findIndex((obj) => obj === object);
        if (objectIndex > -1) {
            this.head = this.tail.splice(objectIndex, 1)[0];
        } else this.head = object;
    }

    public isFresh(): boolean {
        return true;
    }

    public getOriginalRequest() {
        return this.request;
    }

    public getOriginalResponse() {
        return this.response;
    }

    public next(err?: Error) {
        return this.nextFunction(err);
    }
}
