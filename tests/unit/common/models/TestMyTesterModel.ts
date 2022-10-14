import BaseModel from "~env/lib/BaseModel";
import { Attr } from "~env/utils/decorators";

export default class TestMyTesterModel extends BaseModel {

    @Attr()
    public veryUnique!: string;

}
