import addDeepdash from "deepdash-es";
import _, { isNull, isObjectLike } from "lodash";
import onChange from "on-change";
import type BaseModel from "~common/lib/BaseModel";

const lodash = addDeepdash(_);

type eachDeepParams = Required<Parameters<typeof lodash.eachDeep>>;

export function getModelClassByName(name: string) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        let module = require("~env/models/" + name);
        return new Promise<typeof BaseModel>((resolve) => {
            const interval = setInterval(() => {
                if (!module.default) {
                    module = require("~env/models/" + name);
                    return;
                }
                clearInterval(interval);
                resolve(module.default);
            });
        });
    } catch (error) {
        return null;
    }
}

export function eachDeep(obj: any, callback: eachDeepParams["1"], options: eachDeepParams["2"] = {}): ReturnType<typeof lodash.eachDeep> {
    return lodash.eachDeep(obj, (value, key, parentValue, context) => {
        if (context.isCircular) return false;
        return callback(value, key, parentValue, context);
    }, Object.assign({ pathFormat: "array", checkCircular: true, includeRoot: false }, options));
}

export function merge(...args: Parameters<typeof _["merge"]>): ReturnType<typeof _["merge"]> {
    return _.merge(...args);
}

export function camelCase(...args: Parameters<typeof _["camelCase"]>): ReturnType<typeof _["camelCase"]> {
    return _.camelCase(...args);
}

export function pascalCase(str: string): ReturnType<typeof _["camelCase"]> {
    return _.capitalize(camelCase(str));
}

export function union(...args: Parameters<typeof _["union"]>): ReturnType<typeof _["union"]> {
    return _.union(...args);
}

export function intersection(...args: Parameters<typeof _["intersection"]>): ReturnType<typeof _["intersection"]> {
    return _.intersection(...args);
}

export function difference(...args: Parameters<typeof _["difference"]>): ReturnType<typeof _["difference"]> {
    return _.difference(...args);
}

export function resolveProxy<T>(value: T): T {
    if (!isChangeObserved(value)) return value;
    return resolveProxy(onChange.target(value));
}

export function hasOwnProperty(value: any, key: string) {
    if (!isObjectLike(value)) return false;
    return Object.prototype.hasOwnProperty.call(value, key);
}

export function isChangeObservable(value: unknown) {
    return value instanceof Array || value instanceof Set || value instanceof Map;
}

export function isChangeObserved(value: any) {
    if (!isValue(value)) return false;
    if (onChange.target(value) === value) return false;
    return true;
}

export function isUndefined(...args: Parameters<typeof _["isUndefined"]>): ReturnType<typeof _["isUndefined"]> {
    return _.isUndefined(...args);
}

export function isValue(value: any): boolean {
    return !isUndefined(value) && !isNull(value);
}

export function setValue(...args: Parameters<typeof _["set"]>): ReturnType<typeof _["set"]> {
    return _.set(...args);
}

export function getValue(...args: Parameters<typeof _["get"]>): ReturnType<typeof _["get"]> {
    return _.get(...args);
}
