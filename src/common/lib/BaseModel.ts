import { Attr } from "~common/utils/decorators";
import { Schema } from "mongoose";

export default abstract class BaseModel {

    @Attr()
    public id: string = "";

    public dummyId: string = "";

    @Attr()
    public name!: string;

    public getSchema() {
        const schema = Reflect.getMetadata("schema", this) as Schema<typeof this>;
        return schema;
    }
}
