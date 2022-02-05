import { Model } from "mongoose";
import { Constructor } from "type-fest";
import { Attr } from "~common/utils/decorators";
import Attribute from "./Attribute";
// import { Schema } from "mongoose";

export default abstract class BaseModel {

    public static readonly className = "BaseModel";

    public static readonly collection = "BaseModels";

    protected static readonly dataModel: Model<typeof this>;

    protected readonly dataModel!: InstanceType<Model<typeof this>>;

    @Attr()
    public id: string = "";

    @Attr()
    public dummyId: string = "";

    @Attr()
    public name!: string;

    public constructor(..._args: any[]) {
        // intentionally left blanc
    }

    public get className() {
        return (<typeof BaseModel>this.constructor).className;
    }

    public get collection() {
        return (<typeof BaseModel>this.constructor).collection;
    }

    public static getAttribute(name: string): Attribute<Constructor<BaseModel>> {
        const ctorName = Object.getPrototypeOf(this.prototype).constructor.name;
        return Reflect.getMetadata(`${ctorName}:attributeMap`, this.prototype)[name];
    }

    public getAttribute(name: string) {
        return (<typeof BaseModel>this.constructor).getAttribute(name);
    }

    public static getSchema() {
        const ctorName = Object.getPrototypeOf(this.prototype).constructor.name;
        return Reflect.getMetadata(`${ctorName}:schema`, this.prototype);
    }

    public getSchema() {
        return (<typeof BaseModel>this.constructor).getSchema();
    }
}
