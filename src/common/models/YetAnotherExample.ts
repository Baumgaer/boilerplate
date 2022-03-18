import { Attr } from "~common/utils/decorators";
import BaseModel from "~env/lib/BaseModel";
import type AnotherExample from "~env/models/AnotherExample";

export default abstract class YetAnotherExample extends BaseModel {

    @Attr()
    public oneToOneRelation?: AnotherExample;
}
