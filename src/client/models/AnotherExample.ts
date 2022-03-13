import { Attr, AttrGetter, AttrSetter, AttrValidator, Model } from "~client/utils/decorators";
import AnotherCommonExample from "~common/models/AnotherExample";

@Model({ className: "AnotherExample", collectionName: "anotherExamples" })
export default class AnotherExample extends AnotherCommonExample {

    public constructor(params?: ConstructionParams<AnotherExample>) {
        super(params);
    }

    @Attr()
    public override name: string = "jojo";

    @Attr()
    public anotherExampleClient!: Promise<number[]>;

    @AttrValidator("name")
    public validateName(value: string): boolean {
        if (value === "lala") return true;
        return false;
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
