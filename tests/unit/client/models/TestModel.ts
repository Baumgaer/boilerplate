import { Model, Attr } from "~client/utils/decorators";
import TestAbstractModel from "~test/models/TestAbstractModel";
import type { ITestMyInterface, ITestMySecondInterface } from "~client/@types/ITestMyInterface";
import type TestMyTestModel from "~test/models/TestMyTestModel";
import type TestMyTesterModel from "~test/models/TestMyTesterModel";

@Model()
export default class TestModel extends TestAbstractModel {

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
    public aTuple!: [string, number, boolean?];

    @Attr()
    public anInterface!: ITestMyInterface;

    @Attr()
    public anArray!: string[];

    @Attr()
    protected aNumber!: number;
}
