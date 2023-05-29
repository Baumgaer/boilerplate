import BaseRoute from "~server/lib/BaseRoute";
import { Route, Mutation, Query, Arg } from "~server/utils/decorators";
import type { IExecutedAction } from "~server/@types/ActionSchema";
import type BaseModel from "~server/lib/BaseModel";
import type Train from "~server/lib/Train";

@Route({ namespace: "/batch" })
export default class Batch extends BaseRoute {

    @Mutation({ name: "/batch", accessRight: () => true })
    public async handleBatchMutation(train: Train<typeof BaseModel>, @Arg() batch: IExecutedAction[]) {
        console.log("handleBatch", batch);
        // magic
    }

    @Query({ name: "/batch", accessRight: () => true })
    public async handleBatchQuery(_train: Train<typeof BaseModel>) {
        console.log("handleBatch");
        // magic
    }

}
