import { reactive } from "vue";
import ApiClient from "~client/lib/ApiClient";
import { Model, Query, Arg } from "~client/utils/decorators";
import CommonBaseModel from "~common/lib/BaseModel";
import type { SaveOptions } from "typeorm";
import type BaseModelParams from "~client/interfaces/lib/BaseModel";
import type User from "~client/models/User";

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

    public override async save(options?: SaveOptions): Promise<(this & BaseModel) | null> {
        const result = await super.save(options);
        if (!result) return null;

        const executedActions = this.getExecutedActions();
        if (executedActions.length) await ApiClient.batch({ data: { batch: executedActions } });
        return result;
    }

    /**
     * @InheritDoc
     */
    protected override addReactivity(value: this): this {
        return reactive(value) as this;
    }

}
