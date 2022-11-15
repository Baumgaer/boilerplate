import { AttributeError } from "~client/lib/Errors";
import { Attr, AttrGetter, AttrSetter, AttrValidator, Model, Query, Arg } from "~client/utils/decorators";
import AnotherCommonExample from "~common/models/AnotherExample";

@Model()
export default class AnotherExample extends AnotherCommonExample {

    @Attr()
    public override name: string = "jojo";

    @Attr()
    public myUnion: "test" | 42 = 42;

    @Attr()
    public anotherExampleClient!: Lazy<number[]>;

    public constructor(params?: ConstructionParams<AnotherExample>) {
        super(params);
    }

    @Query({ name: "getName", accessRight: () => true })
    public static override queryName(@Arg({ isId: true }) id: string, @Arg() test: string = "testen") {
        console.log("AnotherExample", this, id, test);
        return Promise.resolve();
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
