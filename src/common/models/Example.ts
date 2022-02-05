import BaseModel from "~env/lib/BaseModel";
import { Attr } from "~common/utils/decorators";

export default abstract class Example extends BaseModel {

    @Attr({ alias: "tested" })
    protected test!: {
        prop1: string;
        prop2: number;
        // eslint-disable-next-line
        prop3: Example;
        prop4: Date;
        prop5: number[]
    };

    @Attr()
    public exampleCommon: number = 1;
}
