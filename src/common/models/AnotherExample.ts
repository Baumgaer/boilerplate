import Example from "~env/models/Example";
import { Attr, AttrObserver } from "~env/utils/decorators";
import type YetAnotherExample from "~env/models/YetAnotherExample";

export default abstract class AnotherExample extends Example {

    @Attr()
    public anotherExampleCommon: number[] = [];

    @Attr()
    public myIntersection?: YetAnotherExample & Example;

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
