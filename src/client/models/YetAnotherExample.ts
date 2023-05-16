import { Attr, Model } from "~client/utils/decorators";
import CommonYetAnotherExample from "~common/models/YetAnotherExample";
import type YetAnotherExampleParams from "~client/interfaces/models/YetAnotherExample";
import type Example from "~client/models/Example";

@Model()
export default class YetAnotherExample extends CommonYetAnotherExample {

    @Attr({ relationColumn: "manyToOneRelation", isRelationOwner: true })
    public oneToManyRelation: Example[] = [];

    public constructor(params?: YetAnotherExampleParams) {
        super(params);
    }
}
