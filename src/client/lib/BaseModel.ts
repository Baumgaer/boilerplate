import { Attr } from "~client/utils/decorators";
import CommonBaseModel from "~common/lib/BaseModel";

export default abstract class BaseModel extends CommonBaseModel {

    @Attr()
    public baseModelClient!: string;

    public constructor(params?: ConstructionParams<BaseModel>) {
        super(params);
    }

}
