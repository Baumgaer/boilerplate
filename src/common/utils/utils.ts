import addDeepdash from "deepdash";
import _, { isNull, isObjectLike } from "lodash";
import onChange from "on-change";
import type BaseModel from "~common/lib/BaseModel";

export { compact, union, intersection, difference, camelCase, merge, isPlainObject, isUndefined, upperFirst } from "lodash";

const lodash = addDeepdash(_);

type eachDeepParams = Required<Parameters<typeof lodash.eachDeep>>;

/**
 * Loads the corresponding model class by its name, even if it is not loaded yet.
 * To ensure the model class is loaded, this function checks if there is an
 * export defined
 *
 * @param name name of the model class
 * @returns a promise which resolves the model class if exists
 */
export function getModelClassByName(name: string) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        let module: ModuleLike<typeof BaseModel> = require("~env/models/" + name);
        return new Promise<typeof BaseModel>((resolve) => {
            const interval = setInterval(() => {
                if (!module || !module.default) {
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

/**
 * Iterates over all object like structures taking circular paths into account
 * and avoiding infinite loops.
 *
 * @param obj the object to iterate
 * @param callback a function which will be called for each path
 * @param [options={}] additional options controlling the behavior
 * @returns false to break the iteration and nothing else
 */
export function eachDeep(obj: object, callback: eachDeepParams["1"], options: eachDeepParams["2"] = {}): ReturnType<typeof lodash.eachDeep> {
    return lodash.eachDeep(obj, (value: unknown, key, parentValue: unknown, context) => {
        if (context.isCircular) return false;
        return callback(value, key, parentValue, context);
    }, Object.assign({ pathFormat: "array", checkCircular: true, includeRoot: false }, options));
}

/**
 * Converts string to PascalCase
 */
export function pascalCase(str: string): ReturnType<typeof _["camelCase"]> {
    return _.upperFirst(_.camelCase(str));
}

/**
 * Removes deep nested on-change proxies from the given value
 *
 * @template T the type of the value
 * @param value the value to remove proxy from
 * @returns the unProxyfied value
 */
export function resolveProxy<T>(value: T): T {
    if (!isChangeObserved(value)) return value;
    return resolveProxy(onChange.target(value));
}

/**
 * The short version of Object.prototype.hasOwnProperty.call
 *
 * @param value value to perform check on
 * @param key the key to check for
 * @returns true if has own property and false else
 */
export function hasOwnProperty(value: object, key: string) {
    if (!isObjectLike(value)) return false;
    return Object.prototype.hasOwnProperty.call(value, key);
}

/**
 * Checks if a given value can be observed by on-change
 *
 * @param value the value to check
 * @returns true if can be observed and false else
 */
export function isChangeObservable(value: unknown) {
    return value instanceof Array || value instanceof Set || value instanceof Map || _.isPlainObject(value);
}

/**
 * Checks if a value is already observed by on-change
 *
 * @param value the value to check
 * @returns true if it is already observed and false else
 */
export function isChangeObserved(value: unknown) {
    if (!isValue(value) || !isObjectLike(value)) return false;
    if (onChange.target(value as object) === value) return false;
    return true;
}

/**
 * Checks if a value is not undefined or null
 *
 * @param value the value to check
 * @returns true if it is a value and false else
 */
export function isValue(value: unknown): boolean {
    return !_.isUndefined(value) && !isNull(value);
}

/**
 * @see lodash.set
 */
export function setValue(...args: Parameters<typeof _["set"]>): ReturnType<typeof _["set"]> {
    return _.set(...args);
}

/**
 * @see lodash.get
 */
export function getValue(...args: Parameters<typeof _["get"]>): ReturnType<typeof _["get"]> {
    return _.get(...args);
}
