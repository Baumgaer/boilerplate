import CommonBaseModel from "~common/lib/BaseModel";
import { Model } from "~server/utils/decorators";
import type { SaveOptions } from "typeorm";

/**
 * @see CommonBaseModel
 */
@Model()
export default abstract class BaseModel extends CommonBaseModel {

    public constructor(params?: ConstructionParams<BaseModel>) {
        super(params);
    }

    public static override async getById<T extends BaseModel>(id: UUID): Promise<T | null> {
        if (!id) return null;
        try {
            const model = await this.repository.findOne({ where: { id }, withDeleted: true }) as T | null;
            return model;
        } catch (error) {
            return null;
        }
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
