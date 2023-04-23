import BaseRoute from "~server/lib/BaseRoute";
import { NotFound } from "~server/lib/Errors";
import Logger from "~server/lib/Logger";
import { Route, Query, Mutation, Arg } from "~server/utils/decorators";
import { getCollectionNameToModelMap } from "~server/utils/schema";
import type { IMinimumRouteObject } from "~server/@types/http";
import type BaseModel from "~server/lib/BaseModel";
import type Train from "~server/lib/Train";

const logger = new Logger("server");

@Route({ namespace: "/models/:collection/:instanceId?" })
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

        logger.raw(collection, instanceId, action);
    }

    @Mutation({ name: "/:action" })
    public async handleMutation(train: Train<typeof BaseModel>, @Arg() collection: string, @Arg() action: string, @Arg() instanceId?: UUID) {
        logger.raw(collection, instanceId, action);
    }

    public override async handle(train: Train<typeof BaseModel>, routeObject: IMinimumRouteObject) {
        return super.handle(train, routeObject);
    }

}
