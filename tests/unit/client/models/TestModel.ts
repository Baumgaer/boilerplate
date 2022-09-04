import { Model, Attr } from "~client/utils/decorators";
import TestAbstractModel from "~test/models/TestAbstractModel";
import type TestMyTestModel from "~test/models/TestMyTestModel";
import type TestMyTesterModel from "~test/models/TestMyTesterModel";
import type { IMyInterface } from "~test/utils";

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
    public anIntersection!: TestMyTestModel & TestMyTesterModel;

    @Attr()
    public aTuple!: [undefined, null, boolean?];

    @Attr()
    public anInterface!: IMyInterface;

    @Attr()
    public anArray!: string[];

    @Attr()
    protected aNumber!: number;
}
