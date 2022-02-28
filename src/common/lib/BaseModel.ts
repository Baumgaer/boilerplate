import { Attr } from "~common/utils/decorators";
import { eachDeep, setValue, isUndefined } from "~common/utils/utils";
import type { Model } from "mongoose";
import type { Schema } from "mongoose";
import type BaseAttribute from "~common/lib/BaseAttribute";
import type AttributeSchema from "~common/lib/AttributeSchema";
import type { Constructor } from "type-fest";

export default abstract class BaseModel {

    public static readonly className = "BaseModel";

    public static readonly collection = "BaseModels";

    protected static readonly dataModel: Model<typeof this>;

    public readonly unProxyfiedModel!: typeof this;

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
                if (!attribute || attribute.schema.isInternal) return false;
            }

            if (isUndefined(value)) return;
            if (value instanceof BaseModel) {
                setValue(obj, context.path || key, value.toObject());
            } else setValue(obj, context.path || key, value);
        });
        return obj;
    }

    public static getAttributeSchema<T extends Constructor<BaseModel>>(this: T, name: string): AttributeSchema<T> {
        return Reflect.getMetadata(`${Object.getPrototypeOf(this).name}:attributeSchemaMap`, this.prototype)?.[name];
    }

    public getAttribute<T extends BaseModel>(this: T, name: string): BaseAttribute<T> {
        return Reflect.getMetadata(`${Object.getPrototypeOf(this.constructor).name}:${name}:attribute`, this.unProxyfiedModel);
    }

    public static getSchema<T extends Constructor<BaseModel>>(): Schema<T> {
        return Reflect.getMetadata(`${Object.getPrototypeOf(this.constructor).name}:schema`, this.prototype);
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
