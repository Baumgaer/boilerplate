import { BaseEntity } from "typeorm";
import MetadataStore from "~common/lib/MetadataStore";
import { Attr, AttrObserver } from "~common/utils/decorators";
import { eachDeep, setValue, isUndefined } from "~common/utils/utils";
import type BaseAttribute from "~common/lib/BaseAttribute";
import type { IAttributeChange } from "~common/types/AttributeSchema";

export default abstract class BaseModel extends BaseEntity {

    public static readonly className: string = "BaseModel";

    public static readonly collectionName: string = "BaseModels";

    @Attr({ primary: true })
    public readonly id!: string;

    @Attr({ isCreationDate: true })
    public readonly createdAt: Date = new Date();

    @Attr({ isModifiedDate: true })
    public readonly modifiedAt: Date = new Date();

    @Attr({ isDeletedDate: true })
    public readonly deletedAt!: Date;

    @Attr({ isVersion: true })
    public readonly version: number = 0;

    @Attr()
    public name!: string;

    public readonly className!: string;

    public readonly collectionName!: string;

    public readonly unProxyfiedModel!: typeof this;

    public dummyId: string = "";

    protected backup: Partial<Record<keyof this, any>> = {};

    public constructor(_params?: ConstructionParams<BaseModel>) {
        super();
    }

    public static getSchema() {
        const metadataStore = new MetadataStore();
        return metadataStore.getModelSchema<typeof this>(Object.getPrototypeOf(this), this.className);
    }

    public static getAttributeSchema<T extends typeof BaseModel>(this: T, name: keyof ConstructionParams<InstanceType<T>>) {
        const metadataStore = new MetadataStore();
        return metadataStore.getAttributeSchema(Object.getPrototypeOf(this), name);
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
        eachDeep(this, (value: unknown, key, parentValue: unknown, context) => {
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

    public getSchema() {
        return (<typeof BaseModel>this.constructor).getSchema();
    }

    public getAttribute<T extends typeof BaseModel>(this: InstanceType<T>, name: string): BaseAttribute<T> | undefined {
        const metadataStore = new MetadataStore();
        return metadataStore.getAttribute(this, name);
    }

    public getAttributes<T extends typeof BaseModel>(this: InstanceType<T>) {
        const metadataStore = new MetadataStore();
        return metadataStore.getAttributes(this);
    }

    public hasChanges() {
        const attributes = this.getAttributes();
        for (const attribute of attributes) {
            if (attribute.hasChanges()) return true;
        }
        return false;
    }

    public getChanges() {
        const changes = {} as Record<keyof this, IAttributeChange[]>;
        if (!this.hasChanges()) return changes;

        const attributes = this.getAttributes();
        for (const attribute of attributes) {
            if (!attribute.hasChanges()) continue;
            changes[attribute.name] = attribute.getChanges();
        }
        return changes;
    }

    public removeChanges() {
        const attributes = this.getAttributes();
        for (const attribute of attributes) {
            attribute.removeChanges();
        }
    }

    public undoChanges() {
        const attributes = this.getAttributes();
        for (const attribute of attributes) {
            attribute.undoChanges();
        }
    }

}
