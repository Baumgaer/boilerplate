import BaseModel from "~server/lib/BaseModel";
import BaseRoute from "~server/lib/BaseRoute";
import Models from "~server/routes/Models";
import { Route, Mutation, Query, Arg } from "~server/utils/decorators";
import type { IExecutedAction } from "~server/@types/ActionSchema";
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
        const dummyIdMap: Record<UUID, UUID> = {};
        const resultSet = new Set<BaseModel>();

        function addToResultSet(results: any[]) {
            for (const result of results) {
                if (result instanceof BaseModel) resultSet.add(result);
            }
        }

        for (const action of batch) {
            const { name, collection, args, id, dummyId } = action;

            let idToUse = id;
            if (!idToUse && dummyId) {
                if (dummyId in dummyIdMap) {
                    idToUse = dummyIdMap[dummyId];
                } else idToUse = dummyId;
            }

            if (name === "create") {
                const createdModel = await this.modelsRoute.handleCreate(train, collection, args.params);
                if (createdModel && dummyId) dummyIdMap[dummyId] = createdModel.dummyId;
            } else {
                if (train.httpMethod === "GET") {
                    if (idToUse) {
                        await this.modelsRoute.handleInstanceQuery(train, collection, name, idToUse, args);
                    } else await this.modelsRoute.handleStaticQuery(train, collection, name, args);
                } else {
                    if (idToUse) {
                        addToResultSet(await this.modelsRoute.handleInstanceMutation(train, collection, name, idToUse, args));
                    } else addToResultSet(await this.modelsRoute.handleStaticMutation(train, collection, name, args));
                }
            }
        }

        const resultArray = Array.from(resultSet);
        for (const result of resultArray) {
            await result.save();
        }

        return resultArray;
    }

}
