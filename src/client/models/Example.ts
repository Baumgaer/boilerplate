import CommonExample from "~common/models/Example";
import { Attr, Model } from "~client/utils/decorators";

@Model("Example", "examples")
export default class Example extends CommonExample {

    @Attr()
    public override name: string = "test";

    @Attr()
    public exampleClient: string = "test";
}
