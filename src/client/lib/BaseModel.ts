import { Attr } from "~client/utils/decorators";
import CommonBaseModel from "~common/lib/BaseModel";

export default class BaseModel extends CommonBaseModel {

    @Attr()
    public baseModelClient!: string;
}
