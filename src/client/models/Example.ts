import { Attr, Model, Mutation, Query, Arg } from "~client/utils/decorators";
import CommonExample from "~common/models/Example";
import type YetAnotherExample from "~client/models/YetAnotherExample";

@Model()
export default class Example extends CommonExample {

    @Attr()
    public override name: string = "test";

    @Attr()
    public exampleClient: string = "test";

    @Attr({ relationColumn: "oneToManyRelation" })
    public manyToOneRelation!: YetAnotherExample;

    @Query({ name: "getName", accessRight: () => true })
    public static queryName(@Arg({ name: "id", isId: true }) id: string, @Arg({ name: "test" }) test: string = "testen") {
        console.log(this, id, test);
        return Promise.resolve();
    }

    @Query({ name: "getName", accessRight: () => true })
    public static somethingElse(@Arg({ name: "test" }) test: string = "testen") {
        console.log(test);
        return Promise.resolve();
    }

    @Mutation({ name: "changeName", accessRight: () => true })
    public changeName(@Arg({ name: "name" }) name: string) {
        this.name = name;
        return this.save();
    }

    @Query({ name: "queryDeletedNames", accessRight: () => /*some other magic here*/ true })
    public queryDeletedNames(@Arg({ name: "conditionalDate" }) conditionalDate: Date, @Arg({ name: "conditionalModifiedAt" }) conditionalModifiedAt: Date) {
        console.log(this);
        return (this.constructor as typeof Example).find({ select: ["name"], where: { deletedAt: conditionalDate, modifiedAt: conditionalModifiedAt } });
    }
}
