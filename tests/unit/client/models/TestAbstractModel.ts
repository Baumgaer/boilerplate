import BaseModel from "~client/lib/BaseModel";
import { Model } from "~client/utils/decorators";
import { className, collectionName } from "~test/utils";

// @ts-expect-error 001
@Model({ metadataJson: JSON.stringify({ className, collectionName, isAbstract: true }) })
export default abstract class TestAbstractModel extends BaseModel { }
