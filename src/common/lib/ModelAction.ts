import BaseAction from "~env/lib/BaseAction";
import { Forbidden, NotFound } from "~env/lib/Errors";
import type { ModelLike } from "~env/@types/ModelClass";
import type User from "~env/models/User";

export default class ModelAction<T extends ModelLike> extends BaseAction<T> {

    public async call(thisArg: T | InstanceType<T>, user: User, ...args: any[]): Promise<any> {
        if (!this.schema.descriptor.value) throw new NotFound();
        if (!this.schema.accessRight(user, this.owner)) throw new Forbidden();

        args = [user, ...args];
        const validationResult = await this.schema.validateArguments(args);
        if (!validationResult.success) throw new AggregateError(validationResult.errors);

        return Promise.resolve();
    }

}
