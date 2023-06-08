import BaseModel from "~env/lib/BaseModel";
import { Attr, Model, Mutation, Arg } from "~env/utils/decorators";
import type ExampleParams from "~env/interfaces/models/Example";
import type YetAnotherExample from "~env/models/YetAnotherExample";

@Model()
export default class Example extends BaseModel {

    @Attr()
    public exampleCommon: number = 1;

    @Attr({ relationColumn: "oneToManyRelation" })
    public manyToOneRelation!: YetAnotherExample;

    @Attr()
    protected test: 1 | 2 | 4 = 2;

    public constructor(params?: ExampleParams) {
        super(params);
    }

    @Mutation({ accessRight: () => true })
    public changeName(@Arg() name: string): Promise<this> {
        this.name = name;
        // return this.save();
        return Promise.resolve(this);
    }
}
