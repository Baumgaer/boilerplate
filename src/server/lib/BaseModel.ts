import CommonBaseModel from "~common/lib/BaseModel";

/**
 * @see CommonBaseModel
 */
export default abstract class BaseModel extends CommonBaseModel {

    public constructor(params?: ConstructionParams<BaseModel>) {
        super(params);
    }

    /**
     * @inheritdoc
     */
    protected override addReactivity(value: this): this {
        return value;
    }
}
