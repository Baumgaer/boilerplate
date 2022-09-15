import BaseModel from "~env/lib/BaseModel";
import { Attr } from "~env/utils/decorators";
import type { ITest } from "~common/@types/Test";
import type AnotherExample from "~env/models/AnotherExample";

export default abstract class YetAnotherExample extends BaseModel {

    @Attr()
    public oneToOneRelation?: AnotherExample;

    @Attr()
    public embeddedEntity!: ITest;
}
