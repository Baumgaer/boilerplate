import { reactive } from "vue";
import ApiClient from "~client/lib/ApiClient";
import { Model } from "~client/utils/decorators";
import CommonBaseModel from "~common/lib/BaseModel";
import type { SaveOptions } from "typeorm";
import type BaseModelParams from "~client/interfaces/lib/BaseModel";

/**
 * @see CommonBaseModel
 */
@Model({ isAbstract: false })
export default abstract class BaseModel extends CommonBaseModel {

    public constructor(params?: BaseModelParams) {
        super(params);
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
