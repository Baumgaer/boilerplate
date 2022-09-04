import BaseModel from "~client/lib/BaseModel";
import { Model } from "~client/utils/decorators";

// @ts-expect-error 001
@Model({ metadataJson: JSON.stringify({ className: "MyTesterModel", collectionName: "MyTesterModels", isAbstract: false }) })
export default class TestMyTesterModel extends BaseModel { }
