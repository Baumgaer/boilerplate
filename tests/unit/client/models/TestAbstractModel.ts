import { Model } from "~client/utils/decorators";
import CommonTestAbstractModel from "~common/models/TestAbstractModel";
import type TestAbstractModelParams from "~client/interfaces/models/TestAbstractModel";

@Model()
export default abstract class TestAbstractModel extends CommonTestAbstractModel {

    public constructor(params?: TestAbstractModelParams) {
        super(params);
    }
}
