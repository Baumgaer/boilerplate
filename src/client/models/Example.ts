import { Attr, Model } from "~client/utils/decorators";
import CommonExample from "~common/models/Example";

@Model({ className: "Example", collectionName: "examples" })
export default class Example extends CommonExample {

    @Attr()
    public override name: string = "test";

    @Attr()
    public exampleClient: string = "test";
}
