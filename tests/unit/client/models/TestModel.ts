import { Model } from "~client/utils/decorators";
import CommonTestModel from "~common/models/TestModel";

@Model({ indexes: [{ columns: ["anUnion"] }] })
export default class TestModel extends CommonTestModel { }
