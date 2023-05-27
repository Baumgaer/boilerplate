import BaseRoute from "~server/lib/BaseRoute";
import { Route, Mutation, Query } from "~server/utils/decorators";
import type BaseModel from "~server/lib/BaseModel";
import type Train from "~server/lib/Train";

@Route({ namespace: "/batch" })
export default class Batch extends BaseRoute {

    @Mutation({ name: "/batch", accessRight: () => true })
    public async handleBatchMutation(_train: Train<typeof BaseModel>) {
        console.log("handleBatch");
        // magic
    }

    @Query({ name: "/batch", accessRight: () => true })
    public async handleBatchQuery(_train: Train<typeof BaseModel>) {
        console.log("handleBatch");
        // magic
    }

}
