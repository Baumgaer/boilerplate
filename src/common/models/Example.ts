import BaseModel from "~env/lib/BaseModel";
import { Attr, Model } from "~env/utils/decorators";
import type ExampleParams from "~env/interfaces/models/Example";

@Model()
export default abstract class Example extends BaseModel {

    @Attr()
    public exampleCommon: number = 1;

    @Attr()
    protected test: 1 | 2 | 4 = 2;

    public constructor(params?: ExampleParams) {
        super(params);
    }
}
