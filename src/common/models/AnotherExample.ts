import { Attr, AttrObserver } from "~common/utils/decorators";
import Example from "~env/models/Example";

export default abstract class AnotherExample extends Example {

    @Attr()
    public anotherExampleCommon: number[] = [];

    @AttrObserver("anotherExampleCommon", "add")
    protected onAnotherExampleCommonAdd(value: number, parameters?: ObserverParameters<number>) {
        console.log("add", value, parameters);
    }

    @AttrObserver("anotherExampleCommon", "remove")
    protected onAnotherExampleCommonRemove(value: number, parameters?: ObserverParameters<number>) {
        console.log("remove", value, parameters);
    }

    @AttrObserver("anotherExampleCommon", "change")
    protected onAnotherExampleCommonChange(value: number, parameters?: ObserverParameters<number>) {
        console.log("change", value, parameters);
    }
}
