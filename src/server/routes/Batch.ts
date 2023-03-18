import BaseRoute from "~server/lib/BaseRoute";
import { Route, Mutation } from "~server/utils/decorators";
import type { IMinimumRouteObject } from "~server/@types/http";
import type BaseModel from "~server/lib/BaseModel";
import type Train from "~server/lib/Train";

@Route({ name: "/batch" })
export default class Models extends BaseRoute {

    @Mutation({ name: "/models" })
    public async handleModels() {
        // magic
    }

    @Mutation({ name: "/files" })
    public async handleFiles() {
        // magic
    }

    public override async handle(train: Train<typeof BaseModel>, routeObject: IMinimumRouteObject) {
        return super.handle(train, routeObject);
    }
}
