import ApiClient from "~client/lib/ApiClient";
import { isUndefined } from "~client/utils/utils";
import CommonModelAction from "~common/lib/ModelAction";
import type { ActionOptions } from "~client/@types/ActionSchema";
import type BaseModel from "~client/lib/BaseModel";
import type User from "~client/models/User";


export default class ModelAction<T extends typeof BaseModel> extends CommonModelAction<T> {

    public override call(thisArg: T | InstanceType<T>, user: User, ...args: any[]): Promise<any> {
        super.call(thisArg, user, ...args); // validation only no need to wait

        const result = this.schema.descriptor.value?.call(thisArg, user, ...args);
        const entries = Object.entries(this.schema.argumentSchemas);

        args = [user, ...args];
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

    protected makeRequest(thisArg: T | InstanceType<T>, id: string, parameters: [string, any][]): void {
        if (!this.schema.local) {
            if ("isBaseModel" in thisArg) {
                // If this is an instance of a model, just collect all executed
                // actions to enable sending a batch
                if (this.schema.httpMethod !== "GET") {
                    let id: UUID | undefined;
                    let dummyId: UUID = "" as UUID;
                    if (thisArg.isBaseModel) {
                        id = thisArg.id;
                        dummyId = thisArg.dummyId;
                    }

                    thisArg.addExecutedAction({ id, dummyId, name: this.name, collection: thisArg.collectionName, args: Object.fromEntries(parameters) });
                } else ApiClient.get({ collectionName: thisArg.collectionName, actionName: String(this.name), parameters, id });
            } else {
                // Otherwise we have to send the action immediately because
                // there is no instance which could collect the actions
                const httpMethod = (this.schema.httpMethod?.toLowerCase() || "get") as Lowercase<Exclude<ActionOptions<T>["httpMethod"], undefined>>;
                ApiClient[httpMethod]({ collectionName: thisArg.collectionName, actionName: String(this.name), parameters, id });
            }
        }
    }
}
