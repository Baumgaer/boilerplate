import CommonBaseModel from "~common/lib/BaseModel";
import { Model, Query, Arg } from "~server/utils/decorators";
import type { SaveOptions } from "typeorm";
import type BaseModelParams from "~server/interfaces/lib/BaseModel";
import type User from "~server/models/User";

/**
 * @see CommonBaseModel
 */
@Model({ isAbstract: false })
export default abstract class BaseModel extends CommonBaseModel {

    public constructor(params?: BaseModelParams) {
        super(params);
    }

    @Query({ accessRight: () => true })
    public static override async getById<T extends BaseModel>(user: User, @Arg({ primary: true }) id: UUID): Promise<T | null> {
        return super.getById(user, id);
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
