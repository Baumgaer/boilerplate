import CommonBaseModel from "~common/lib/BaseModel";

export default abstract class BaseModel extends CommonBaseModel {

    public constructor(params?: ConstructionParams<BaseModel>) {
        super(params);
    }

    protected override addReactivity(value: this): this {
        return value;
    }
}
