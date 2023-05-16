import Logger from "~env/lib/Logger";
import Example from "~env/models/Example";
import { Attr, AttrObserver, Model } from "~env/utils/decorators";
import type AnotherExampleParams from "~env/interfaces/models/AnotherExample";
import type YetAnotherExample from "~env/models/YetAnotherExample";

const logger = new Logger("devel");

@Model()
export default class AnotherExample extends Example {

    @Attr()
    public anotherExampleCommon: number[] = [];

    @Attr()
    public myIntersection?: YetAnotherExample & Example;

    public constructor(params?: AnotherExampleParams) {
        super(params);
    }

    @AttrObserver("anotherExampleCommon", "add")
    protected onAnotherExampleCommonAdd(value: number, parameters?: ObserverParameters<number>) {
        logger.raw("add", value, parameters);
    }

    @AttrObserver("anotherExampleCommon", "remove")
    protected onAnotherExampleCommonRemove(value: number, parameters?: ObserverParameters<number>) {
        logger.raw("remove", value, parameters);
    }

    @AttrObserver("anotherExampleCommon", "change")
    protected onAnotherExampleCommonChange(value: number, parameters?: ObserverParameters<number>) {
        logger.raw("change", value, parameters);
    }
}
