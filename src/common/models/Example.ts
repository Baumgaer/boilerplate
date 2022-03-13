import { Attr } from "~common/utils/decorators";
import BaseModel from "~env/lib/BaseModel";

export default abstract class Example extends BaseModel {

    @Attr()
    public exampleCommon: number = 1;

    @Attr()
    protected test: 1 | 2 | 4 = 2;
}
