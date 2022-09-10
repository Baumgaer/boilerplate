export interface ITest {
    testAttr: TextRange<50, 100>;

    secondAttr: NumberRange<50, 100>;

    thirdAttr: Lazy<Varchar<50>>
}
