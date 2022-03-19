import { Attr, AttrObserver } from "~common/utils/decorators";
import Example from "~env/models/Example";

export default abstract class AnotherExample extends Example {

    @Attr()
    public anotherExampleCommon: number[] = [];

    @AttrObserver("anotherExampleCommon", "add")
    protected onAnotherExampleCommonAdd(value: number, parameters?: ObserverParameters<number>) {
        console.log(value, parameters);
    }
}
