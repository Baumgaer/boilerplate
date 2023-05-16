import BaseModel from "~env/lib/BaseModel";
import { Attr, Model } from "~env/utils/decorators";
import type { ITest } from "~common/@types/Test";
import type YetAnotherExampleParams from "~env/interfaces/models/YetAnotherExample";
import type AnotherExample from "~env/models/AnotherExample";

@Model()
export default class YetAnotherExample extends BaseModel {

    @Attr({ isRelationOwner: true })
    public oneToOneRelation?: AnotherExample;

    @Attr()
    public embeddedEntity?: ITest;

    public constructor(params?: YetAnotherExampleParams) {
        super(params);
    }
}
