import { Attr, Model } from "~client/utils/decorators";
import CommonExample from "~common/models/Example";
import type YetAnotherExample from "~client/models/YetAnotherExample";

@Model()
export default class Example extends CommonExample {

    @Attr()
    public override name: string = "test";

    @Attr()
    public exampleClient: string = "test";

    @Attr({ relationColumn: "oneToManyRelation" })
    public manyToOneRelation!: YetAnotherExample;
}
