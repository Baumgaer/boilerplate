import { Model } from "~client/utils/decorators";
import CommonTestMyTesterModel from "~common/models/TestMyTesterModel";
import type TestMyTesterModelParams from "~client/interfaces/models/TestMyTesterModel";

@Model()
export default class TestMyTesterModel extends CommonTestMyTesterModel {

    public constructor(params?: TestMyTesterModelParams) {
        super(params);
    }
}
