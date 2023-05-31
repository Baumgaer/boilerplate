import BaseRoute from "~server/lib/BaseRoute";
import Models from "~server/routes/Models";
import { Route, Mutation, Query, Arg } from "~server/utils/decorators";
import type { IExecutedAction } from "~server/@types/ActionSchema";
import type BaseModel from "~server/lib/BaseModel";
import type BaseServer from "~server/lib/BaseServer";
import type Train from "~server/lib/Train";

@Route({ namespace: "/batch" })
export default class Batch extends BaseRoute {

    protected modelsRoute: Models;

    public constructor(server: BaseServer) {
        super(server);
        this.modelsRoute = new Models(server, true);
    }

    @Query({ name: "/", accessRight: () => true })
    public async handleGet(train: Train<typeof BaseModel>, @Arg() batch: IExecutedAction[]) {
        return this.handleRequest(train, batch);
    }

    @Mutation({ name: "/", accessRight: () => true })
    public async handlePost(train: Train<typeof BaseModel>, @Arg() batch: IExecutedAction[]) {
        return this.handleRequest(train, batch);
    }

    @Mutation({ name: "/", httpMethod: "PATCH", accessRight: () => true })
    public async handlePatch(train: Train<typeof BaseModel>, @Arg() batch: IExecutedAction[]) {
        return this.handleRequest(train, batch);
    }

    protected async handleRequest(train: Train<typeof BaseModel>, batch: IExecutedAction[]) {
        for (const action of batch) {
            const { name, collection, args, id, dummyId } = action;
            console.log(dummyId, args);
            if (name === "create") {
                // special behavior
            } else {
                if (train.httpMethod === "GET") {
                    if (id) {
                        await this.modelsRoute.handleInstanceQuery(train, collection, name, id, args);
                    } else await this.modelsRoute.handleStaticQuery(train, collection, name, args);
                } else {
                    if (id) {
                        await this.modelsRoute.handleInstanceMutation(train, collection, name, id, args);
                    } else await this.modelsRoute.handleStaticMutation(train, collection, name, args);
                }
            }
        }
    }

}
