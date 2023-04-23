import Logger from "~client/lib/Logger";
import { Attr, Model, Mutation, Query, Arg } from "~client/utils/decorators";
import CommonExample from "~common/models/Example";
import type YetAnotherExample from "~client/models/YetAnotherExample";

const logger = new Logger("devel");
@Model()
export default class Example extends CommonExample {

    @Attr()
    public override name: string = "test";

    @Attr()
    public exampleClient: string = "test";

    @Attr({ relationColumn: "oneToManyRelation" })
    public manyToOneRelation!: YetAnotherExample;

    @Query({ accessRight: () => true })
    public static queryName(@Arg({ primary: true }) id: string, @Arg() test: string = "testen") {
        logger.raw("Example", this, id, test);
        return Promise.resolve();
    }

    @Query({ accessRight: () => true })
    public static somethingElse(@Arg() test: string = "testen"): Promise<void> {
        logger.raw(test);
        return Promise.resolve();
    }

    @Mutation({ accessRight: () => true })
    public changeName(@Arg() name: string): Promise<this> {
        this.name = name;
        // return this.save();
        return Promise.resolve(this);
    }

    @Query({ accessRight: () => true })
    public queryDeletedNames(@Arg() _conditionalDate: Date, @Arg() _conditionalModifiedAt: Date): Promise<Example[]> {
        logger.raw(this);
        // return (this.constructor as typeof Example).find({ select: ["name"], where: { deletedAt: conditionalDate, modifiedAt: conditionalModifiedAt } });
        return Promise.resolve([this]);
    }
}
