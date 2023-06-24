import { AttributeError } from "~env/lib/Errors";
import TestAbstractModel from "~env/models/TestAbstractModel";
import { Attr, AttrGetter, AttrSetter, AttrObserver, AttrValidator, Model, Arg, Mutation, Query } from "~env/utils/decorators";
import type { ITestMyInterface, ITestMySecondInterface } from "~env/@types/ITestMyInterface";
import type TestModelParams from "~env/interfaces/models/TestModel";
import type BaseModel from "~env/lib/BaseModel";
import type TestMyTestModel from "~env/models/TestMyTestModel";
import type TestMyTesterModel from "~env/models/TestMyTesterModel";
import type User from "~env/models/User";

function queryAccessRight(user: BaseModel, object: TestModel) {
    object.queryResult = "TestModel";
    return true;
}

@Model()
export default class TestModel extends TestAbstractModel {

    /**
     * This is an unidirectional one to one relation
     */
    @Attr()
    public oneToOne?: TestMyTestModel;

    /**
     * This is an unidirectional one to one relation with potentially two
     * different models.
     */
    @Attr()
    public oneToOneUnion?: TestMyTestModel | TestMyTesterModel;

    /**
     * Bidirectional one to one relations should also be work when a relationColumn
     * is given.
     */
    @Attr({ relationColumn: "bidirectionalOneToOne", isRelationOwner: true })
    public bidirectionalOneToOne?: TestMyTestModel;

    /**
     * Many TestModels can have one TestMyTestModel in this field
     */
    @Attr({ relationColumn: "oneToMany" })
    public manyToOne?: TestMyTestModel;

    /**
     * Many TestModels can have many TestMyTestModels in this field
     */
    @Attr({ relationColumn: "manyToMany", isRelationOwner: true })
    public manyToMany?: TestMyTestModel[];

    /**
     * Because this is an array and does not have any vive versa, this shouldn't be
     * a relation
     */
    @Attr()
    public noRelation?: TestMyTestModel[];

    /**
     * This is marked as generated with an UUID so typeORM should notice that
     */
    @Attr({ isGenerated: "uuid" })
    public aGeneratedColumn?: UUID;

    /**
     * Simple boolean should work
     */
    @Attr()
    public aBoolean: boolean = true;

    /**
     * Simple string should work. This one is a bit special because it is used as
     * an index in the database, so it's unique
     */
    @Attr({ index: { unique: true } })
    public readonly aString?: string;

    /**
     * Most Databases support dates, so they should also work
     */
    @Attr()
    public aDate!: Date;

    /**
     * This is an union type with an initializer. So this should not be required
     * because it has a proper default value.
     */
    @Attr()
    public anUnion: "Test" | 42 = 42;

    /**
     * Parenthesized types will also be resolved. This is also not a required one
     */
    @Attr()
    public aParenthesizedUnion: "Test" | 42 | ("tseT" | 24) = 42;

    /**
     * This is a useless type but null and undefined can be distinguished by typeORM.
     */
    @Attr()
    public aUselessField: null | undefined;

    /**
     * An Intersection will be something like a merge in the database. This one is optional
     */
    @Attr()
    public anIntersection?: TestMyTestModel & TestMyTesterModel;

    /**
     * This is an required intersection
     */
    @Attr()
    public anotherIntersection!: ITestMyInterface & ITestMySecondInterface;

    /**
     * Intersections should also work, when they are inside a parenthesized type
     */
    @Attr()
    public anIntersectionWithinArray?: (ITestMyInterface & ITestMySecondInterface)[];

    /**
     * Tuples are special arrays. These will not be handled by typeORM but by our framework.
     * This one requires at least two entries and at most three.
     */
    @Attr()
    public aTuple!: [string, number, boolean?];

    /**
     * Interfaces will be resolved to embedded entities
     */
    @Attr()
    public anInterface!: ITestMyInterface;

    /**
     * Beside a tuple, arrays should also work
     */
    @Attr()
    public anArray!: string[];

    /**
     * This is a lazy property which will be loaded after it is asked and returns a promise
     */
    @Attr()
    public theLazyOne?: Lazy<string>;

    /**
     * This text is at lead 5 characters and at most 15 characters long
     */
    @Attr()
    public theTextRange?: TextRange<5, 15>;

    /**
     * This number is at least 5 and at most 15
     */
    @Attr()
    public theNumberRange?: NumberRange<5, 15>;

    /**
     * This is a string in a valid e-mail format
     */
    @Attr()
    public theEmail?: Email;

    /**
     * The value of this property is unique in the database
     */
    @Attr()
    public theUniqueOne?: Unique<string>;

    /**
     * This is a varchar which is at most 15 characters long
     */
    @Attr()
    public theVarchar?: Varchar<15>;

    /**
     * This is a simple number
     */
    @Attr()
    protected aNumber!: number;

    /**
     * This is a null value
     */
    @Attr()
    protected aNull?: null;

    /**
     * this is an undefined value
     */
    @Attr()
    protected anUndefined?: undefined;

    /**
     * This is the string literal "test"
     */
    @Attr()
    protected aStringLiteral?: "test";

    /**
     * This is the number literal 42
     */
    @Attr()
    protected aNumberLiteral?: 42;

    /**
     * This is the boolean literal true
     */
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

    public constructor(params?: TestModelParams) {
        super(params);
    }

    @Query({ accessRight: queryAccessRight })
    public override testQueryAction(user: User, @Arg() id: UUID, @Arg({ max: 20 }) param1: string, @Arg() param2: ITestMyInterface) {
        this.actionParameters.id = id;
        this.actionParameters.param1 = param1;
        this.actionParameters.param2 = param2;
        return Promise.resolve(true);
    }

    @Mutation()
    public override testMutationAction(user: User, @Arg() id: UUID, @Arg() param1: string) {
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
        if (!value) return [];
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
    protected validateAString(value?: string) {
        this.validateCount++;
        if (!value?.startsWith("lol")) return new AttributeError("aString", "format", [], value);
        return true;
    }
}
