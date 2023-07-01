export {
    camelCase,
    cloneDeep,
    compact,
    difference,
    eachDeep,
    getModelClassByName,
    getValue,
    hasOwnProperty,
    intersection,
    isArray,
    isChangeObservable,
    isChangeObserved,
    isEqual,
    isObject,
    isPlainObject,
    isUndefined,
    isValue,
    merge,
    mergeWith,
    pascalCase,
    resolveProxy,
    setValue,
    union,
    upperFirst,
    uniq,
    allEqual
} from "~common/utils/utils";

export function getEnvironment() {
    return "server";
}
