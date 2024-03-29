import { AttributeError } from "~client/lib/Errors";
import Logger from "~client/lib/Logger";
import { Attr, AttrGetter, AttrSetter, AttrValidator, Model, Query, Arg } from "~client/utils/decorators";
import AnotherCommonExample from "~common/models/AnotherExample";
import type AnotherExampleParams from "~client/interfaces/models/AnotherExample";
import type User from "~client/models/User";

const logger = new Logger("devel");

@Model()
export default class AnotherExample extends AnotherCommonExample {

    @Attr()
    public override name: string = "jojo";

    @Attr()
    public myUnion: "test" | 42 = 42;

    @Attr()
    public anotherExampleClient!: Lazy<number[]>;

    public constructor(params?: AnotherExampleParams) {
        super(params);
    }

    @Query({ name: "getName", accessRight: () => true })
    public static override queryName(user: User, @Arg({ primary: true }) id: UUID, @Arg() test: string = "testen") {
        logger.raw("AnotherExample", this, id, test);
        return Promise.resolve();
    }

    @Query({ name: "testIt2", accessRight: () => true })
    public testIt2(user: User, @Arg({ primary: true }) id: string, @Arg() test: string = "testen") {
        logger.raw("AnotherExample", this, id, test);
        this.name = "test123";
        return Promise.resolve();
    }

    @Query({ name: "testIt", accessRight: () => true })
    public testIt(user: User, @Arg({ primary: true }) id: string, @Arg() test: string = "testen") {
        this.testIt2(user, id);
        return new Promise<void>((resolve) => {
            logger.raw("AnotherExample", this, id, test);
            setTimeout(() => {
                this.myUnion = "test";
                resolve();
            });
        });
    }

    @AttrValidator("name")
    public validateName(value: string) {
        if (value === "lala") return true;
        return new AttributeError("name", "format", [], value);
    }

    @AttrGetter("name")
    protected getName(): string {
        if (this.name === "jojo") return "lala";
        return this.name;
    }

    @AttrSetter("name")
    protected setName(value: string): string {
        if (value === "jojo") return "lala";
        return value;
    }
}
