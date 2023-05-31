import CommonRouteAction from "~common/lib/RouteAction";
import { Forbidden, NotFound } from "~server/lib/Errors";
import type { RouteLike } from "~server/@types/RouteClass";
import type { HttpMethods } from "~server/@types/http";
import type ActionSchema from "~server/lib/ActionSchema";
import type BaseModel from "~server/lib/BaseModel";
import type Train from "~server/lib/Train";

export default class RouteAction<T extends RouteLike> extends CommonRouteAction<T> {

    public readonly httpMethod: HttpMethods;

    public constructor(owner: InstanceType<T> | T, name: string, schema: ActionSchema<T>, httpMethod: HttpMethods) {
        super(owner, name, schema);
        this.httpMethod = httpMethod;
    }

    public call(thisArg: T | InstanceType<T>, train: Train<typeof BaseModel>, ...args: any[]) {
        if (!this.schema.descriptor.value) throw new NotFound();
        if (!this.schema.accessRight(train.user, train)) throw new Forbidden();

        args = [train, ...args];
        const validationResult = this.schema.validateArguments(args);
        if (!validationResult.success) throw new AggregateError(validationResult.errors);

        return this.schema.descriptor.value.call(thisArg, ...args) || Promise.resolve();
    }
}
