import BaseRoute from "~server/lib/BaseRoute";
import { NotFound } from "~server/lib/Errors";
import { Route, Query, Mutation, Arg } from "~server/utils/decorators";
import { getCollectionNameToModelMap } from "~server/utils/schema";
import type { IMinimumRouteObject } from "~server/@types/http";
import type BaseModel from "~server/lib/BaseModel";
import type Train from "~server/lib/Train";

@Route({ name: "/models/:collection/:instanceId?" })
export default class Models extends BaseRoute {

    @Query({ name: "/:action" })
    public async handleQuery(train: Train<typeof BaseModel>, @Arg() collection: string, @Arg() action: string, @Arg() instanceId?: UUID) {
        const map = getCollectionNameToModelMap();
        const ModelClass = map[collection];
        if (!ModelClass) throw new NotFound(`collection ${collection} does not exist`);

        if (instanceId) {
            // magic on an instance
        } else {
            // magic on a class
        }

        console.log(collection, instanceId, action);
    }

    @Mutation({ name: "/:action" })
    public async handleMutation(train: Train<typeof BaseModel>, @Arg() collection: string, @Arg() action: string, @Arg() instanceId?: UUID) {
        console.log(collection, instanceId, action);
    }

    public override async handle(train: Train<typeof BaseModel>, routeObject: IMinimumRouteObject) {
        return super.handle(train, routeObject);
    }

}
