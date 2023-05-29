import CommonBaseModel from "~common/lib/BaseModel";
import { Model } from "~server/utils/decorators";
import type { SaveOptions } from "typeorm";
import type BaseModelParams from "~server/interfaces/lib/BaseModel";

/**
 * @see CommonBaseModel
 */
@Model({ isAbstract: false })
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
        return value;
    }
}
