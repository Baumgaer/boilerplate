import MetadataStore from "./MetadataStore";
import { Attr, AttrObserver } from "~common/utils/decorators";
import { eachDeep, setValue, isUndefined } from "~common/utils/utils";
import { BaseEntity } from "typeorm";
import type ModelSchema from "./ModelSchema";
import type BaseAttribute from "~common/lib/BaseAttribute";
import type AttributeSchema from "~common/lib/AttributeSchema";
import type { Constructor } from "type-fest";

export default abstract class BaseModel extends BaseEntity {

    public static readonly className: string = "BaseModel";

    public static readonly collectionName: string = "BaseModels";

    public readonly className = (<typeof BaseModel>this.constructor).className;

    public readonly collectionName = (<typeof BaseModel>this.constructor).collectionName;

    public readonly unProxyfiedModel!: typeof this;

    @Attr({ primary: true })
    public readonly id!: string;

    @Attr()
    public name!: string;

    public dummyId: string = "";

    protected backup: Partial<Record<keyof this, any>> = {};

    public constructor(_params?: ConstructionParams<BaseModel>) {
        super();
    }

    public isNew(): boolean {
        return Boolean(!this.id && this.dummyId);
    }

    public toId() {
        return this.dummyId || this.id;
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

    public static getSchema() {
        const metadataStore = new MetadataStore();
        return metadataStore.getModelDefinition(Object.getPrototypeOf(this), this.className);
    }

    public getSchema() {
        return <ModelSchema<Constructor<typeof this>>>(<typeof BaseModel>this.constructor).getSchema();
    }

    public static getAttributeSchema<T extends Constructor<BaseModel>>(this: T, name: string): AttributeSchema<T> {
        return Reflect.getMetadata(`${Object.getPrototypeOf(this).name}:attributeSchemaMap`, this.prototype)?.[name];
    }

    public getAttribute<T extends BaseModel>(this: T, name: string): BaseAttribute<T> {
        return Reflect.getMetadata(`${Object.getPrototypeOf(this.constructor).name}:${name}:attribute`, this.unProxyfiedModel);
    }

    public discard() {
        throw new Error("Not implemented");
    }

    /**
     * Removes the dummy id when the model is saved and got a real id
     *
     * @protected
     * @param value the given id
     * @memberof BaseModel
     */
    @AttrObserver("id", "change")
    protected onIdChange(value: string): void {
        if (!value) return;
        this.dummyId = "";
    }
}
