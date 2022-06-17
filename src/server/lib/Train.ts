import type { NextFunction, Request, Response } from "express";
import type { HttpMethods } from "~server/@types/http";
import type BaseModel from "~server/lib/BaseModel";

export default class Train<T extends BaseModel> {

    public head: T | null;

    public tail: T[] = [];

    private request: Request;

    private response: Response;

    private nextFunction: NextFunction;

    private _user: any | null;

    public constructor(request: Request, response: Response, next: NextFunction, object?: T[]) {
        this.request = request;
        this.response = response;
        this.nextFunction = next;
        this.tail = object ?? [];
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

    public get coolies() {
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

    public setUser(user: any) {
        this._user = user;
    }

    public resetUser() {
        this._user = null;
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
