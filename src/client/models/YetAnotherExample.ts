import { Attr, Model } from "~client/utils/decorators";
import CommonYetAnotherExample from "~common/models/YetAnotherExample";
import type Example from "~client/models/Example";

@Model({ className: "YetAnotherExample", collectionName: "yetAnotherExamples" })
export default class YetAnotherExample extends CommonYetAnotherExample {

    @Attr({ relationColumn: "manyToOneRelation", isRelationOwner: true })
    public oneToManyRelation!: Example[];
}
