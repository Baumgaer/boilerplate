import BaseRoute from "~server/lib/BaseRoute";
import { Route, Mutation } from "~server/utils/decorators";
import type ActionSchema from "~server/lib/ActionSchema";
import type BaseModel from "~server/lib/BaseModel";
import type Train from "~server/lib/Train";

@Route({ namespace: "/batch" })
export default class Batch extends BaseRoute {

    @Mutation({ name: "/batch" })
    public async handleBatch() {
        console.log("handleBatch");
        // magic
    }

    @Mutation({ name: "/files" })
    public async handleFiles() {
        console.log("handleFiles");
        // magic
    }

    public override async handle<T extends typeof BaseRoute>(train: Train<typeof BaseModel>, routeObject: ActionSchema<T>) {
        return super.handle(train, routeObject);
    }
}
