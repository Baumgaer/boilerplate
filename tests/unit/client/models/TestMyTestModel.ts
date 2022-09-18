import { Model, Attr } from "~client/utils/decorators";
import CommonTestMyTestModel from "~common/models/TestMyTestModel";
import type TestModel from "~client/models/TestModel";

@Model()
export default class TestMyTestModel extends CommonTestMyTestModel {

    @Attr({ relationColumn: "bidirectionalOneToOne" })
    public bidirectionalOneToOne?: TestModel;

    @Attr({ relationColumn: "manyToOne" })
    public oneToMany?: TestModel[];

    @Attr({ relationColumn: "manyToMany" })
    public manyToMany?: TestModel[];
}
