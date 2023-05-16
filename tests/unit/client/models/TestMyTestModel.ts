import { Model } from "~client/utils/decorators";
import CommonTestMyTestModel from "~common/models/TestMyTestModel";
import type TestMyTestModelParams from "~client/interfaces/models/TestMyTestModel";

@Model()
export default class TestMyTestModel extends CommonTestMyTestModel {

    public constructor(params?: TestMyTestModelParams) {
        super(params);
    }
}
