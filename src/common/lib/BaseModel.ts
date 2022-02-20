import { Attr, AttrGetter } from "~common/utils/decorators";
import { eachDeep, setValue, isUndefined } from "~common/utils/utils";
import type { Model } from "mongoose";
import type { Schema } from "mongoose";
import type Attribute from "~common/lib/Attribute";
import type { Constructor } from "type-fest";

export default abstract class BaseModel {

    public static readonly className = "BaseModel";

    public static readonly collection = "BaseModels";

    protected static readonly dataModel: Model<typeof this>;

    protected readonly dataModel!: InstanceType<typeof BaseModel["dataModel"]>;

    @Attr()
    public readonly id!: string;

    public dummyId: string = "";

    @Attr()
    public name!: string;

    protected backup: Partial<Record<keyof this, any>> = {};

    public constructor(_params?: ConstructionParams<BaseModel>) {
        // intentionally left blanc
    }

    public static getById<T extends BaseModel>(this: Constructor<T>, _id: string): T | null {
        throw new Error("Not implemented");
    }

    public static getOne<T extends BaseModel>(this: Constructor<T>, _obj: Record<string, any>): T | null {
        throw new Error("Not implemented");
    }

    public static getMany<T extends BaseModel>(this: Constructor<T>, _obj: Record<string, any>): T[] {
        throw new Error("Not implemented");
    }

    public static getAll<T extends BaseModel>(this: Constructor<T>, _obj: Record<string, any>): T[] {
        throw new Error("Not implemented");
    }

    @AttrGetter("id")
    protected getId() {
        return this.dataModel._id.toString();
    }

    public get className() {
        return (<typeof BaseModel>this.constructor).className;
    }

    public get collection() {
        return (<typeof BaseModel>this.constructor).collection;
    }

    public isNew(): boolean {
        return this.dummyId !== "";
    }

    public toId() {
        return this.dummyId || this.id;
    }

    public toString() {
        return `${this.className}:${this.toId()}`;
    }

    public toJson() {
        return JSON.stringify(this.toObject());
    }

    public toObject() {
        const obj: Partial<ConstructionParams<this>> = {};
        eachDeep(this, (value, key, parentValue, context) => {
            if (parentValue instanceof BaseModel) {
                const attribute = parentValue.getAttribute(key.toString());
                if (!attribute || attribute.isInternal) return false;
            }

            if (isUndefined(value)) return;
            if (value instanceof BaseModel) {
                setValue(obj, context.path || key, value.toObject());
            } else setValue(obj, context.path || key, value);
        });
        return obj;
    }

    public static getAttribute(name: string): Attribute<Constructor<BaseModel>> {
        return Reflect.getMetadata(`${this.className}:attributeMap`, this.prototype)[name];
    }

    public getAttribute(name: string) {
        return (<typeof BaseModel>this.constructor).getAttribute(name);
    }

    public static getSchema(): Schema<BaseModel> {
        return Reflect.getMetadata(`${this.className}:schema`, this.prototype);
    }

    public getSchema() {
        return (<typeof BaseModel>this.constructor).getSchema();
    }

    public updateFromServer() {
        throw new Error("Not implemented");
    }

    public save() {
        throw new Error("Not implemented");
    }

    public discard() {
        throw new Error("Not implemented");
    }
}
