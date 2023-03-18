import ApiClient from "~client/lib/ApiClient";
import CommonModelAction from "~common/lib/ModelAction";
import type { ActionOptions } from "~client/@types/ActionSchema";
import type BaseModel from "~client/lib/BaseModel";


export default class ModelAction<T extends typeof BaseModel> extends CommonModelAction<T> {

    protected override makeRequest(thisArg: T | InstanceType<T>, id: string, parameters: [string, any][]): void {
        if (!this.schema.local) {
            if ("isBaseModel" in thisArg) {
                // If this is an instance of a model, just collect all executed
                // actions to enable sending a batch
                if (this.schema.httpMethod !== "GET") {
                    thisArg.addExecutedAction(String(this.name), Object.fromEntries(parameters));
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
