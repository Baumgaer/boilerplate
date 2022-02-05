import AnotherCommonExample from "~common/models/AnotherExample";
import { Attr, Model } from "~client/utils/decorators";

@Model("AnotherExample", "anotherExamples")
export default class AnotherExample extends AnotherCommonExample {

    @Attr()
    public override name: string = "jojo";

    @Attr()
    public anotherExampleClient!: boolean;
}
