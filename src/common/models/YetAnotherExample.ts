import { Attr } from "~common/utils/decorators";
import BaseModel from "~env/lib/BaseModel";
import type AnotherExample from "~env/models/AnotherExample";

interface ITest {
    testAttr: string;

    secondAttr: number;

    thirdAttr: Lazy<varchar<50>>
}

export default abstract class YetAnotherExample extends BaseModel {

    @Attr()
    public oneToOneRelation?: AnotherExample;

    @Attr()
    public embeddedEntity!: ITest;
}
