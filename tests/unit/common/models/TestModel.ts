import { AttributeError } from "~common/lib/Errors";
import TestAbstractModel from "~env/models/TestAbstractModel";
import { Attr, AttrGetter, AttrSetter, AttrObserver, AttrValidator, Model, Arg, Mutation, Query } from "~env/utils/decorators";
import type { ITestMyInterface, ITestMySecondInterface } from "~env/@types/ITestMyInterface";
import type BaseModel from "~env/lib/BaseModel";
import type TestMyTestModel from "~env/models/TestMyTestModel";
import type TestMyTesterModel from "~env/models/TestMyTesterModel";


function queryAccessRight(user: BaseModel, object: TestModel) {
    object.queryResult = "TestModel";
    return true;
}

@Model()
export default class TestModel extends TestAbstractModel {

    @Attr()
    public oneToOne?: TestMyTestModel;

    @Attr()
    public oneToOneUnion?: TestMyTestModel | TestMyTesterModel;

    @Attr({ relationColumn: "bidirectionalOneToOne", isRelationOwner: true })
    public bidirectionalOneToOne?: TestMyTestModel;

    @Attr({ relationColumn: "oneToMany" })
    public manyToOne?: TestMyTestModel;

    @Attr({ relationColumn: "manyToMany", isRelationOwner: true })
    public manyToMany?: TestMyTestModel[];

    @Attr()
    public noRelation?: TestMyTestModel[];

    @Attr({ isGenerated: "uuid" })
    public aGeneratedColumn?: UUID;

    @Attr()
    public aBoolean: boolean = true;

    @Attr({ index: { unique: true } })
    public readonly aString?: string;

    @Attr()
    public aDate!: Date;

    @Attr()
    public anUnion: "Test" | 42 = 42;

    @Attr()
    public aParenthesizedUnion: "Test" | 42 | ("tseT" | 24) = 42;

    @Attr()
    public aUselessField: null | undefined;

    @Attr()
    public anIntersection?: TestMyTestModel & TestMyTesterModel;

    @Attr()
    public anotherIntersection!: ITestMyInterface & ITestMySecondInterface;

    @Attr()
    public anIntersectionWithinArray?: (ITestMyInterface & ITestMySecondInterface)[];

    @Attr()
    public aTuple!: [string, number, boolean?];

    @Attr()
    public anInterface!: ITestMyInterface;

    @Attr()
    public anArray!: string[];

    @Attr()
    public theLazyOne?: Lazy<string>;

    @Attr()
    public theTextRange?: TextRange<5, 15>;

    @Attr()
    public theNumberRange?: NumberRange<5, 15>;

    @Attr()
    public theEmail?: Email;

    @Attr()
    public theUniqueOne?: Unique<string>;

    @Attr()
    public theVarchar?: Varchar<15>;

    @Attr()
    protected aNumber!: number;

    @Attr()
    protected aNull?: null;

    @Attr()
    protected anUndefined?: undefined;

    @Attr()
    protected aStringLiteral?: "test";

    @Attr()
    protected aNumberLiteral?: 42;

    @Attr()
    protected aBooleanLiteral?: true;

    public getterCount: number = 0;

    public setterCount: number = 0;

    public changeCount: number = 0;

    public addCount: number = 0;

    public removeCount: number = 0;

    public validateCount: number = 0;

    public hookParameters: any;

    public hookValue: any;

    public constructor(params?: ConstructionParams<TestModel>) {
        super(params);
    }

    @Query({ accessRight: queryAccessRight })
    public override testQueryAction(@Arg() id: UUID, @Arg({ max: 20 }) param1: string) {
        console.log(this);
        this.actionParameters.id = id;
        this.actionParameters.param1 = param1;
        return Promise.resolve(true);
    }

    @Mutation()
    public override testMutationAction(@Arg() id: UUID, @Arg() param1: string) {
        this.actionParameters.id = id;
        this.actionParameters.param1 = param1;
        return Promise.resolve(true);
    }

    @AttrGetter("aDate")
    protected getADate() {
        this.getterCount++;
        return new Date();
    }

    @AttrSetter("anArray")
    protected setAnArray(value: string[]) {
        if (!value) return;
        this.setterCount++;
        if (!value.length) return ["1", "2", "3"];
        return value;
    }

    @AttrObserver("anInterface", "change")
    protected onAnInterfaceAdd(value: typeof this["anInterface"], parameters?: ObserverParameters<typeof this["anInterface"]>): void {
        this.changeCount++;
        this.hookValue = value;
        this.hookParameters = parameters;
    }

    @AttrObserver("aTuple", "change")
    protected onATupleChange(value: typeof this["aTuple"], parameters?: ObserverParameters<typeof this["aTuple"]>): void {
        this.changeCount++;
        this.hookValue = value;
        this.hookParameters = parameters;
    }

    @AttrObserver("aTuple", "add")
    protected onATupleAdd(value: typeof this["aTuple"], parameters?: ObserverParameters<typeof this["aTuple"]>): void {
        this.addCount++;
        this.hookValue = value;
        this.hookParameters = parameters;
    }

    @AttrObserver("aTuple", "remove")
    protected onATupleRemove(value: typeof this["aTuple"], parameters?: ObserverParameters<typeof this["aTuple"]>): void {
        this.removeCount++;
        this.hookValue = value;
        this.hookParameters = parameters;
    }

    @AttrValidator("aString")
    protected validateAString(value: this["aString"]) {
        this.validateCount++;
        if (!value?.startsWith("lol")) return new AttributeError("aString", "format", [], value);
        return true;
    }
}
