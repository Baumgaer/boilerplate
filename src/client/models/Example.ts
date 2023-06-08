import Logger from "~client/lib/Logger";
import { Attr, Model, Query, Arg } from "~client/utils/decorators";
import CommonExample from "~common/models/Example";
import type ExampleParams from "~client/interfaces/models/Example";

const logger = new Logger("devel");
@Model()
export default class Example extends CommonExample {

    @Attr()
    public override name: string = "test";

    @Attr()
    public exampleClient: string = "test";

    public constructor(params?: ExampleParams) {
        super(params);
    }

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

    @Query({ accessRight: () => true })
    public queryDeletedNames(@Arg() _conditionalDate: Date, @Arg() _conditionalModifiedAt: Date): Promise<Example[]> {
        logger.raw(this);
        // return (this.constructor as typeof Example).find({ select: ["name"], where: { deletedAt: conditionalDate, modifiedAt: conditionalModifiedAt } });
        return Promise.resolve([this]);
    }
}
