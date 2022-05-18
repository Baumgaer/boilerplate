import { Attr } from "~common/utils/decorators";
import BaseModel from "~env/lib/BaseModel";
import type AnotherExample from "~env/models/AnotherExample";

interface ITest {
    testAttr: TextRange<50, 100>;

    secondAttr: NumberRange<50, 100>;

    thirdAttr: Lazy<Varchar<50>>
}

export default abstract class YetAnotherExample extends BaseModel {

    @Attr()
    public oneToOneRelation?: AnotherExample;

    @Attr()
    public embeddedEntity!: ITest;
}
