import BaseModel from "~env/lib/BaseModel";
import { Attr } from "~common/utils/decorators";
export default abstract class Example extends BaseModel {

    @Attr({ alias: "tested" }) test?: BaseModel;
}
