import { Model, Attr } from "~client/utils/decorators";
import TestAbstractModel from "~test/models/TestAbstractModel";
import { createMetadataJson, className, collectionName } from "~test/utils";
import type TestMyTestModel from "~test/models/TestMyTestModel";
import type TestMyTesterModel from "~test/models/TestMyTesterModel";
import type { IMyInterface } from "~test/utils";

// @ts-expect-error 001
@Model({ metadataJson: JSON.stringify({ className, collectionName, isAbstract: false }) })
export default class TestModel extends TestAbstractModel {

    // @ts-expect-error 001
    @Attr({ metadataJson: createMetadataJson("aBoolean") })
    public aBoolean: boolean = true;

    // @ts-expect-error 001
    @Attr({ metadataJson: createMetadataJson("aString", false, false, true) })
    public readonly aString?: string;

    // @ts-expect-error 001
    @Attr({ metadataJson: createMetadataJson("aNumber", true, true) })
    public aNumber!: number; // This normally has to be at least protected because it's marked as "isInternal"

    // @ts-expect-error 001
    @Attr({ metadataJson: createMetadataJson("aDate", true) })
    public aDate!: Date;

    // @ts-expect-error 001
    @Attr({ metadataJson: createMetadataJson("anUnion", false) })
    public anUnion: "Test" | 42 = 42;

    // @ts-expect-error 001
    @Attr({ metadataJson: createMetadataJson("anIntersection", true) })
    public anIntersection!: TestMyTestModel & TestMyTesterModel;

    // @ts-expect-error 001
    @Attr({ metadataJson: createMetadataJson("aTuple", true) })
    public aTuple!: [undefined, null, boolean?];

    // @ts-expect-error 001
    @Attr({ metadataJson: createMetadataJson("anInterface", true) })
    public anInterface!: IMyInterface;

    // @ts-expect-error 001
    @Attr({ metadataJson: createMetadataJson("anArray", true) })
    public anArray!: string[];
}
