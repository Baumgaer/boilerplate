import { isNull, isUndefined } from "lodash";

export function isValue(value: any): boolean {
    return !isUndefined(value) && !isNull(value);
}
