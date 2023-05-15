import { reactive } from "vue";
import CommonBaseModel from "~common/lib/BaseModel";
import type { SaveOptions } from "typeorm";

/**
 * @see CommonBaseModel
 */
export default abstract class BaseModel extends CommonBaseModel {

    public constructor(params?: ConstructionParams<BaseModel>) {
        super(params);
    }

    public save(options?: SaveOptions): Promise<this & BaseModel> {
        return (this.constructor as typeof BaseModel).repository.save(this, options);
    }

    /**
     * @InheritDoc
     */
    protected override addReactivity(value: this): this {
        return reactive(value) as this;
    }

}
