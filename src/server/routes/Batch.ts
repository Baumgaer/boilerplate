import BaseRoute from "~server/lib/BaseRoute";
import { Route, Mutation, Query, Arg } from "~server/utils/decorators";
import type { IExecutedAction } from "~server/@types/ActionSchema";
import type BaseModel from "~server/lib/BaseModel";
import type Train from "~server/lib/Train";

@Route({ namespace: "/batch/:collection" })
export default class Batch extends BaseRoute {

    @Query({ name: "/:id", accessRight: () => true })
    public async handleInstanceQuery(train: Train<typeof BaseModel>, @Arg() collection: string, @Arg({ primary: true }) id: UUID, @Arg() batch: IExecutedAction[]) {
        return this.handleRequest(train, collection, batch, id);
    }

    @Query({ name: "/", accessRight: () => true })
    public async handleStaticQuery(train: Train<typeof BaseModel>, @Arg() collection: string, @Arg() batch: IExecutedAction[]) {
        return this.handleRequest(train, collection, batch);
    }

    @Mutation({ name: "/:id", accessRight: () => true })
    public async handleInstanceMutation(train: Train<typeof BaseModel>, @Arg() collection: string, @Arg({ primary: true }) id: UUID, @Arg() batch: IExecutedAction[]) {
        return this.handleRequest(train, collection, batch, id);
    }

    @Mutation({ name: "/", accessRight: () => true })
    public async handleStaticMutation(train: Train<typeof BaseModel>, @Arg() collection: string, @Arg() batch: IExecutedAction[]) {
        return this.handleRequest(train, collection, batch);
    }

    protected async handleRequest(train: Train<typeof BaseModel>, collection: string, batch: IExecutedAction[], id?: UUID) {
        console.log(train.httpMethod, train.url, collection, id, batch);
    }

}
