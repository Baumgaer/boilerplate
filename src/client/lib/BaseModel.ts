import { Attr } from "~client/utils/decorators";
import CommonBaseModel from "~common/lib/BaseModel";

export default class BaseModel extends CommonBaseModel {

    public constructor(params?: ConstructionParams<BaseModel>) {
        super(params);
    }

    @Attr()
    public baseModelClient!: string;
}
