import BaseModel from "~env/lib/BaseModel";
import { Query, Mutation, Arg } from "~env/utils/decorators";

function queryAccessRight(user: BaseModel, object: TestAbstractModel) {
    object.queryResult = "TestAbstractModel";
    return true;
}

function mutationAccessRight(user: BaseModel, object: TestAbstractModel) {
    object.mutationResult = "TestAbstractModel";
    return true;
}

export default abstract class TestAbstractModel extends BaseModel {

    public queryResult?: string;

    public mutationResult?: string;

    public actionParameters: Record<string, any> = {};

    @Query({ accessRight: queryAccessRight })
    public testQueryAction(@Arg() id: UUID, @Arg({ max: 10 }) param1: string) {
        this.actionParameters.id = id;
        this.actionParameters.param1 = param1;
        return Promise.resolve(false);
    }

    @Mutation({ accessRight: mutationAccessRight })
    public testMutationAction(@Arg() id: UUID, @Arg() param1: string) {
        this.actionParameters.id = id;
        this.actionParameters.param1 = param1;
        return Promise.resolve(false);
    }
}
