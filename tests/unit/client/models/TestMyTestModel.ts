import BaseModel from "~client/lib/BaseModel";
import { Model, Attr } from "~client/utils/decorators";
import type TestModel from "~client/models/TestModel";

@Model()
export default class TestMyTestModel extends BaseModel {

    @Attr({ relationColumn: "bidirectionalOneToOne" })
    public bidirectionalOneToOne?: TestModel;

    @Attr({ relationColumn: "manyToOne" })
    public oneToMany?: TestModel[];

    @Attr({ relationColumn: "manyToMany" })
    public manyToMany?: TestModel[];
}
