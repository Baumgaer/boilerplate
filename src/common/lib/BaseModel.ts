import { Attr } from "~common/utils/decorators";
import { eachDeep, setValue, isUndefined } from "~common/utils/utils";
import { BaseEntity } from "typeorm";
import type BaseAttribute from "~common/lib/BaseAttribute";
import type AttributeSchema from "~common/lib/AttributeSchema";
import type { Constructor } from "type-fest";

export default abstract class BaseModel extends BaseEntity {

    public static readonly className = "BaseModel";

    public static readonly collectionName = "BaseModels";

    public readonly className = (<typeof BaseModel>this.constructor).className;

    public readonly collectionName = (<typeof BaseModel>this.constructor).collectionName;

    public readonly unProxyfiedModel!: typeof this;

    @Attr({ primary: true })
    public readonly id!: string;

    public dummyId: string = "";

    @Attr()
    public name!: string;

    protected backup: Partial<Record<keyof this, any>> = {};

    public constructor(_params?: ConstructionParams<BaseModel>) {
        super();
    }

    public isNew(): boolean {
        return this.hasId() && !this.dummyId;
    }

    public toId() {
        return this.dummyId || this.id;
    }

    public override toString() {
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

    public static getSchema() {
        return Reflect.getMetadata(`${Object.getPrototypeOf(this.constructor).name}:schema`, this.prototype);
    }

    public getSchema() {
        return (<typeof BaseModel>this.constructor).getSchema();
    }

    public discard() {
        throw new Error("Not implemented");
    }
}
