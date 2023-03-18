import BaseAction from "~env/lib/BaseAction";
import { isUndefined } from "~env/utils/utils";
import type { ModelLike } from "~env/@types/ModelClass";

export default class ModelAction<T extends ModelLike> extends BaseAction<T> {

    public call(thisArg: T | InstanceType<T>, ...args: any[]) {
        const result = this.schema.descriptor.value?.call(thisArg, ...args);
        const entries = Object.entries(this.schema.argumentSchemas);

        const parameters = entries.filter((entry) => {
            return !entry[1].primary && !isUndefined(args[entry[1].index || 0]);
        }).map((entry) => [entry[0], args[entry[1].index || 0]]) as [string, any][];

        let id = "";
        let idParameterIndex = entries.findIndex((entry) => Boolean(entry[1].primary));
        if ("isNew" in thisArg && !thisArg.isNew()) {
            id = thisArg.getId();
        } else if (idParameterIndex > -1) {
            idParameterIndex = entries[idParameterIndex][1].index || 0;
            if (isUndefined(args[idParameterIndex])) {
                id = "";
            } else id = args[idParameterIndex];
        }

        this.makeRequest(thisArg, id, parameters);

        return result || Promise.resolve();
    }

    protected makeRequest(_thisArg: T | InstanceType<T>, _id: string, _parameters: [string, any][]) {
        // This is just an interface. Real implementation on server or client side!
    }
}
