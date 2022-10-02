import TestAbstractModel from "~env/models/TestAbstractModel";
import { Attr } from "~env/utils/decorators";
import type { ITestMyInterface, ITestMySecondInterface } from "~env/@types/ITestMyInterface";
import type TestMyTestModel from "~env/models/TestMyTestModel";
import type TestMyTesterModel from "~env/models/TestMyTesterModel";

export default class TestModel extends TestAbstractModel {

    @Attr()
    public oneToOne?: TestMyTestModel;

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

    @Attr()
    public readonly aString?: string;

    @Attr()
    public aDate!: Date;

    @Attr()
    public anUnion: "Test" | 42 = 42;

    @Attr()
    public aUselessField: null | undefined;

    @Attr()
    public anIntersection!: TestMyTestModel & TestMyTesterModel;

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
}
