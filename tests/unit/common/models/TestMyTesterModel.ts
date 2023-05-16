import BaseModel from "~env/lib/BaseModel";
import { Attr, Model } from "~env/utils/decorators";
import type TestMyTesterModelParams from "~env/interfaces/models/TestMyTesterModel";

@Model()
export default class TestMyTesterModel extends BaseModel {

    @Attr()
    public veryUnique!: string;

    public constructor(params?: TestMyTesterModelParams) {
        super(params);
    }
}
