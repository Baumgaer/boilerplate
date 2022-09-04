import BaseModel from "~client/lib/BaseModel";
import { Model } from "~client/utils/decorators";

// @ts-expect-error 001
@Model({ metadataJson: JSON.stringify({ className: "MyTestModel", collectionName: "MyTestModels", isAbstract: false }) })
export default class TestMyTestModel extends BaseModel { }
