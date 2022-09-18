import BaseModel from "~env/lib/BaseModel";
import { Attr } from "~env/utils/decorators";
import type TestModel from "~env/models/TestModel";

export default class TestMyTestModel extends BaseModel {
    @Attr({ relationColumn: "bidirectionalOneToOne" })
    public bidirectionalOneToOne?: TestModel;

    @Attr({ relationColumn: "manyToOne" })
    public oneToMany?: TestModel[];

    @Attr({ relationColumn: "manyToMany" })
    public manyToMany?: TestModel[];
}
