import CommonModelAction from "~common/lib/ModelAction";
import type { ModelLike } from "~server/@types/ModelClass";
import type User from "~server/models/User";

export default class ModelAction<T extends ModelLike> extends CommonModelAction<T> {

    public override async call(thisArg: T | InstanceType<T>, user: User, ...args: any[]): Promise<any> {
        await super.call(thisArg, user, ...args);
        return this.schema.descriptor.value?.call(thisArg, user, ...args);
    }

}
