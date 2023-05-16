import BaseModel from "~env/lib/BaseModel";
import { Attr, Model } from "~env/utils/decorators";
import type TestMyTestModelParams from "~env/interfaces/models/TestMyTestModel";
import type TestModel from "~env/models/TestModel";

@Model()
export default class TestMyTestModel extends BaseModel {
    @Attr({ relationColumn: "bidirectionalOneToOne" })
    public bidirectionalOneToOne?: TestModel;

    @Attr({ relationColumn: "manyToOne" })
    public oneToMany?: TestModel[];

    @Attr({ relationColumn: "manyToMany" })
    public manyToMany?: TestModel[];

    public constructor(params?: TestMyTestModelParams) {
        super(params);
    }
}
