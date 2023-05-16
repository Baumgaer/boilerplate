import { Model } from "~client/utils/decorators";
import CommonTestModel from "~common/models/TestModel";
import type TestModelParams from "~client/interfaces/models/TestModel";

@Model({ indexes: [{ columns: ["anUnion"] }] })
export default class TestModel extends CommonTestModel {

    public constructor(params?: TestModelParams) {
        super(params);
    }
}
