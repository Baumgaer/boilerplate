import { reactive } from "vue";
import { Model } from "~client/utils/decorators";
import CommonBaseModel from "~common/lib/BaseModel";
import type { SaveOptions } from "typeorm";
import type BaseModelParams from "~client/interfaces/lib/BaseModel";

/**
 * @see CommonBaseModel
 */
@Model()
export default abstract class BaseModel extends CommonBaseModel {

    public constructor(params?: BaseModelParams) {
        super(params);
    }

    public override save(options?: SaveOptions): Promise<this & BaseModel> {
        return (this.constructor as typeof BaseModel).repository.save(this, options);
    }

    /**
     * @InheritDoc
     */
    protected override addReactivity(value: this): this {
        return reactive(value) as this;
    }

}
