import _, { isNull, isUndefined as _isUndefined, set, get, difference as _difference, union as _union, intersection as _intersection, isObjectLike } from "lodash";
import onChange from "on-change";
import addDeepdash from "deepdash-es";

const lodash = addDeepdash(_);

type eachDeepParams = Required<Parameters<typeof lodash.eachDeep>>;

export function eachDeep(obj: any, callback: eachDeepParams["1"], options: eachDeepParams["2"] = {}): ReturnType<typeof lodash.eachDeep> {
    return lodash.eachDeep(obj, (value, key, parentValue, context) => {
        if (context.isCircular) return false;
        return callback(value, key, parentValue, context);
    }, Object.assign({ pathFormat: "array", checkCircular: true, includeRoot: false }, options));
}

export function union(...args: Parameters<typeof _union>): ReturnType<typeof _union> {
    return _union(...args);
}

export function intersection(...args: Parameters<typeof _intersection>): ReturnType<typeof _intersection> {
    return _intersection(...args);
}

export function difference(...args: Parameters<typeof _difference>): ReturnType<typeof _difference> {
    return _difference(...args);
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

export function isUndefined(...args: Parameters<typeof _isUndefined>): ReturnType<typeof _isUndefined> {
    return _isUndefined(...args);
}

export function isValue(value: any): boolean {
    return !isUndefined(value) && !isNull(value);
}

export function setValue(...args: Parameters<typeof set>): ReturnType<typeof set> {
    return set(...args);
}

export function getValue(...args: Parameters<typeof get>): ReturnType<typeof get> {
    return get(...args);
}
