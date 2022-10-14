import { BaseEntity } from "typeorm";
import MetadataStore from "~common/lib/MetadataStore";
import { AttributeError, ValidationError } from "~env/lib/Errors";
import { Attr, AttrObserver } from "~env/utils/decorators";
import { eachDeep, setValue, isUndefined, hasOwnProperty } from "~env/utils/utils";
import type { AttributeSchemaName, ModelChanges, RawObject } from "~common/@types/BaseModel";
import type { ModelLike } from "~env/@types/ModelClass";
import type BaseAttribute from "~env/lib/BaseAttribute";
import type EnvBaseModel from "~env/lib/BaseModel";

/**
 * This class should be a parent of each other model. It wraps the BaseEntity
 * of TypeORM and provides some default common attributes which each model
 * should have. It also provides some basic methods for data conversion and
 * handling attributes or schemas.
 */
export default abstract class BaseModel extends BaseEntity {

    /**
     * The name of the class after compile time. This will be set by the
     * @Model() decorator which will receive this value by a developer or
     * by the reflectionTransformer.
     */
    public static readonly className: string;

    /**
     * The name of the collection where the model is stored in after compile time.
     * This will be set by the @Model() decorator which will receive this value
     * by a developer or by the reflectionTransformer. The naming strategy is
     * to add an "s" at the end because we assume that a collection always
     * contains several models of this type.
     */
    public static readonly collectionName: string;

    /**
     * The ID field in the database to be able to identify each model doubtless.
     * This will be set by the server. You never should use this to identify a model.
     * Use getId instead!
     */
    @Attr({ primary: true })
    public readonly id?: UUID;

    /**
     * The date of creation. This will be set automatically
     */
    @Attr({ isCreationDate: true })
    public readonly createdAt: Date = new Date();

    /**
     * The date of the last modification which will be equal with "createdAt"
     * when the model was just created. Otherwise it will be updated automatically.
     */
    @Attr({ isModifiedDate: true })
    public readonly modifiedAt: Date = new Date();

    /**
     * The date of deletion. This means that a model still exists in the data
     * base but is soft deleted (marked as deleted). This will be set by the server.
     */
    @Attr({ isDeletedDate: true })
    public readonly deletedAt?: Date;

    /**
     * The number of the current version which will be increased each time the
     * model is saved with changes.
     */
    @Attr({ isVersion: true })
    public readonly version: number = 0;

    /**
     * Every object should have at least a name to enable humans to identify
     * the model in frontend.
     */
    @Attr()
    public name!: string;

    /**
     * @see BaseModel.className
     */
    public readonly className!: string;

    /**
     * @see BaseModel.collectionName
     */
    public readonly collectionName!: string;

    /**
     * This gives access to the model instance without proxy around.
     * This enables to change an attribute without causing
     * changes and also gives the ability to improve performance.
     */
    public readonly unProxyfiedModel!: typeof this;

    /**
     * The id of the model until it has no official id from the server
     */
    public dummyId: string = "";

    public constructor(_params?: ConstructionParams<BaseModel>) {
        super();
    }

    /**
     * Looks for the schema of the current instance and returns it
     *
     * @returns the schema of the model
     */
    public static getSchema() {
        const metadataStore = new MetadataStore();
        return metadataStore.getModelSchema(Object.getPrototypeOf(this), this.className);
    }

    /**
     * Looks for the attribute given by the name and returns its schema
     *
     * @param this current this context
     * @param name the name of the attribute
     * @returns the schema of the attribute given by name
     */
    public static getAttributeSchema<T extends typeof BaseModel>(this: T, name: AttributeSchemaName<T>) {
        return this.getSchema()?.getAttributeSchema(name);
    }

    /**
     * Removes the dummy id when the model is saved and got a real id
     *
     * @param value the given id
     */
    @AttrObserver("id", "change")
    protected onIdChange(value: string): void {
        if (!value) return;
        this.dummyId = "";
    }

    /**
     * Checks if the model is still new. A model is new, when it has a dummyId
     * and has not yet received an id from the server.
     *
     * @returns true if the model is still new and false else
     */
    public isNew(): boolean {
        return Boolean(!this.id && this.dummyId);
    }

    /**
     * Returns the id of the model
     *
     * @returns dummyId if exists and id else
     */
    public getId() {
        return this.dummyId || this.id;
    }

    /**
     * iterates over all attributes of the current model and stringifies it.
     *
     * @returns a json string of the models attributes
     */
    public toJson() {
        return JSON.stringify(this.toObject());
    }

    /**
     * Iterates over all attributes of the model and adds it to a plain object
     * if it has a value valid value. If the attribute is internal,
     * the attribute will be ignored. It also performs transformations on the
     * attribute while not modifying the attribute itself.
     *
     * @returns a deep js plain object of all attributes
     */
    public toObject() {
        const obj: RawObject<this> = {};
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

    /**
     * @see BaseModel.getSchema
     */
    public getSchema() {
        return (<typeof BaseModel>this.constructor).getSchema();
    }

    /**
     * returns the attributes instance identified by the current model
     * instance and the given name.
     *
     * @param this current this context
     * @param name the name of the attribute
     * @returns the unique initialized attribute owned by this model instance and identified by the given name
     */
    public getAttribute<T extends ModelLike>(this: InstanceType<T>, name: string): BaseAttribute<T> | undefined {
        const metadataStore = new MetadataStore();
        return metadataStore.getAttribute(this, name);
    }

    /**
     * collects all attributes of this model instance and returns them.
     *
     * @param this current this context
     * @returns array of all attributes
     */
    public getAttributes<T extends ModelLike>(this: InstanceType<T>) {
        const metadataStore = new MetadataStore();
        return metadataStore.getAttributes(this);
    }

    /**
     * Iterates over all attributes and checks them for changes.
     *
     * @returns true if there are changes and false else
     */
    public hasChanges() {
        const attributes = this.getAttributes();
        for (const attribute of attributes) {
            if (attribute.hasChanges()) return true;
        }
        return false;
    }

    /**
     * Iterates over all attributes and collects their changes if exist.
     * All attributes with changes will be stored in a plain object.
     *
     * @returns a plain object with attribute names as key and corresponding changes as values
     */
    public getChanges() {
        const changes = {} as ModelChanges<this>;

        const attributes = this.getAttributes();
        for (const attribute of attributes) {
            if (!attribute.hasChanges()) continue;
            changes[attribute.name as keyof this] = attribute.getChanges();
        }
        return changes;
    }

    /**
     * Iterates over all attributes and removes their changes.
     * NOTE: This is **NOT** a discard / undo!
     */
    public removeChanges() {
        const attributes = this.getAttributes();
        for (const attribute of attributes) attribute.removeChanges();
    }

    /**
     * Iterates over all attributes and revokes their changes to get the
     * initial state after the last call of save().
     */
    public undoChanges() {
        const attributes = this.getAttributes();
        for (const attribute of attributes) attribute.undoChanges();
    }

    /**
     * Applies all given changes to the corresponding attributes.
     * This will modify the current existing changes of the attributes but only
     * in a correction way.
     *
     * @param changes plain object with attribute names as keys and changes as values
     */
    public applyChanges(changes: Partial<ModelChanges<this>>) {
        for (const attributeName in changes) {
            if (hasOwnProperty(changes, attributeName)) {
                const attributeChanges = changes[attributeName];
                const attribute = this.getAttribute(attributeName);
                if (attribute) attribute.applyChanges(attributeChanges);
            }
        }
    }

    public validate(this: EnvBaseModel, obj = this.getValidationObject()) {
        const errors: AggregateError[] = [];
        for (const key in obj) {
            if (hasOwnProperty(obj, key)) {
                const attribute = this.getAttribute(key);
                if (!attribute) {
                    errors.push(new AggregateError([new AttributeError(key, "inexistent", [key], obj[key])]));
                } else if (attribute.schema.isInternal) {
                    errors.push(new AggregateError([new AttributeError(key, "forbidden", [key], obj[key])]));
                } else {
                    const validationResult = attribute.validate(obj[key]);
                    if (validationResult instanceof AggregateError) errors.push(validationResult);
                }
            }
        }
        if (errors.length) return new ValidationError(errors, this);
        return true;
    }

    /**
     * A lifecycle hook that will be called before the passed properties
     * will be assigned to the instance. This has to return an object with
     * construction parameters.
     *
     * @param properties properties to merge into the instance of the model
     * @returns new properties
     */
    protected prePropertyMixin(properties: Record<string, any> = {}) {
        return properties;
    }

    /**
     * This is called by the ModelClass when the model is in construction.
     * This should return the instance itself or a proxy which wraps the
     * instance to enable reactivity for a framework or something else in
     * addition to the models reactivity.
     *
     * @param _value the instance which should be wrapped with a proxy
     */
    /* istanbul ignore next This is just a mock */
    protected addReactivity(_value: this): this {
        throw new Error("Not implemented");
    }

    private getValidationObject() {
        let entries: any[][] = [];
        if (this.isNew()) entries = this.getAttributes().map((attribute) => [attribute.name, attribute.owner[attribute.name]]);
        if (this.hasChanges()) entries = Object.keys(this.getChanges()).map((attributeName) => [attributeName, Reflect.get(this, attributeName)]);
        return Object.fromEntries(entries.filter((entry) => {
            return !this.getAttribute(entry[0])?.schema.isInternal;
        }).map((entry) => {
            if (entry[1] instanceof BaseModel) return [entry[0], entry[1].toObject()];
            return entry;
        }));
    }

}
