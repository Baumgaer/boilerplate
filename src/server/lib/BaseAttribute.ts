import CommonBaseAttribute from "~common/lib/BaseAttribute";
import type BaseModel from "~server/lib/BaseModel";

export default class BaseAttribute<T extends typeof BaseModel> extends CommonBaseAttribute<T> {

    protected override addReactivity(value: InstanceType<T>[this["name"]]) {
        return value;
    }
}
