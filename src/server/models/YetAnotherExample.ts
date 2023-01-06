import CommonYetAnotherExample from "~common/models/YetAnotherExample";
import { Attr, Model } from "~server/utils/decorators";
import type Example from "~server/models/Example";

@Model()
export default class YetAnotherExample extends CommonYetAnotherExample {

    @Attr({ relationColumn: "manyToOneRelation", isRelationOwner: true })
    public oneToManyRelation!: Example[];
}
