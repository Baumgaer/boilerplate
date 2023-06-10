import { Model as ModelType } from "~env/lib/DataTypes";
import ModelAction from "~env/lib/ModelAction";
import ModelSchemaBased from "~env/lib/ModelSchemaBased";
import Store from "~env/lib/Store";
import { Attr, Model, AttrObserver } from "~env/utils/decorators";
import { eachDeep, setValue, isUndefined, hasOwnProperty, isObject } from "~env/utils/utils";
import type { Repository, SaveOptions } from "typeorm";
import type { ModelChanges, RawObject } from "~env/@types/BaseModel";
import type BaseModelParams from "~env/interfaces/lib/BaseModel";
import type ActionSchema from "~env/lib/ActionSchema";
import type BaseAttribute from "~env/lib/BaseAttribute";
import type EnvBaseModel from "~env/lib/BaseModel";
import type ModelSchema from "~env/lib/ModelSchema";
import type User from "~env/models/User";

/**
 * This class should be a parent of each other model. It wraps the BaseEntity
 * of TypeORM and provides some default common attributes which each model
 * should have. It also provides some basic methods for data conversion and
 * handling attributes or schemas.
 */
@Model({ isAbstract: false })
export default abstract class BaseModel extends ModelSchemaBased {

    /**
     * This gives access to the model (instance | class) without proxy around.
     * This enables to change an attribute without causing
     * changes and also gives the ability to improve performance.
     */
    public static override readonly unProxyfiedObject: typeof BaseModel;

    protected static repository: Repository<EnvBaseModel>;

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

    public readonly isBaseModel: boolean = true;

    /**
     * The id of the model until it has no official id from the server
     */
    public dummyId!: UUID;

    public constructor(params?: BaseModelParams) {
        super(params);
    }

    public static async getById<T extends EnvBaseModel>(user: User, id: UUID): Promise<T | null> {
        if (!id) return null;

        const store = Store.getInstance();
        const modelFromStore = store.getModelById(this.collectionName, id);
        if (modelFromStore) return modelFromStore as T;

        try {
            const model = await this.repository.findOne({ where: { id }, withDeleted: true }) as T | null;
            return model;
        } catch (error) {
            return null;
        }
    }

    public static useRepository(repository: Repository<EnvBaseModel>) {
        this.repository = repository;
    }

    /**
     * @inheritdoc
     */
    public static override getSchema() {
        return super.getSchema("Model", this.className);
    }

    /**
     * @inheritdoc
     */
    public static override getActionSchema(name: string): ActionSchema<typeof EnvBaseModel> | null {
        return super.getActionSchema(name);
    }

    public static override getAction(name: string) {
        return super.getAction(name, ModelAction) as ModelAction<any>;
    }

    public static override getActions() {
        return super.getActions(ModelAction) as ModelAction<any>[];
    }

    @AttrObserver("id", "change")
    protected onIdChange(_newValue: UUID, parameters?: ObserverParameters<UUID>) {
        const store = Store.getInstance();
        const { className, dummyId, collectionName } = this;
        const oldId = parameters?.oldValue;

        const oldEntry = store.getModelById(collectionName, oldId ?? dummyId);
        if (oldEntry) {
            store.removeModel({ className, dummyId, collectionName });
            store.addModel(this);
        }
    }

    /**
     * Provides the possibility to check if a value is a model.
     * HINT: This is mainly provided to avoid import loops. You should prefer
     * the usual instanceof check.
     *
     * @param value the value to check for model instance
     * @returns true if the given value is a model and false else
     */
    public isModel(value: unknown): value is BaseModel {
        if (!value || !isObject(value)) return false;
        return value instanceof BaseModel;
    }

    /**
     * Checks if the model is still new. A model is new, when it has a dummyId
     * and has not yet received an id from the server.
     *
     * @returns true if the model is still new and false else
     */
    public override isNew(): boolean {
        return Boolean(!this.id && this.dummyId);
    }

    /**
     * Returns the id of the model
     *
     * @returns dummyId if exists and id else
     */
    public override getId() {
        return this.id || this.dummyId || super.getId();
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
                const attribute = parentValue.getAttribute(key as keyof typeof parentValue);
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
    public override getSchema(): ModelSchema<typeof EnvBaseModel> | null {
        return super.getSchema("Model", this.className);
    }

    /**
     * @inheritdoc
     */
    public override getActionSchema(name: string): ActionSchema<typeof EnvBaseModel> | null {
        return super.getActionSchema(name);
    }

    /**
     * @inheritdoc
     */
    public override getAction(name: string) {
        return super.getAction(name) as ModelAction<typeof EnvBaseModel> | null;
    }

    public override getActions() {
        return super.getActions() as ModelAction<typeof EnvBaseModel>[];
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
                if (!attributeChanges) continue;
                const attribute = this.getAttribute(attributeName);
                if (attribute) attribute.applyChanges(attributeChanges);
            }
        }
    }

    public validate(obj = this.getValidationObject()) {
        return ModelType({
            name: this.className,
            getAttribute: (name) => this.getAttribute(name) as BaseAttribute<typeof EnvBaseModel> | null
        }).validate(obj);
    }

    public isAllowed(actionName: string, user: EnvBaseModel) {
        const action = this.getActionSchema(String(actionName));
        if (!action) return false;
        return Boolean(action.accessRight?.(user, this));
    }

    public async save(options?: SaveOptions): Promise<(this & EnvBaseModel) | null> {
        if (!this.hasChanges()) return null;
        return (this.constructor as typeof BaseModel).repository.save(this, options);
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
     * @param value the instance which should be wrapped with a proxy
     */
    /* istanbul ignore next This is just a mock */
    protected addReactivity(_value: this): this {
        throw new Error("Not implemented");
    }

    private getValidationObject() {
        let entries: any[][] = [];
        if (this.isNew()) entries = this.getAttributes().map((attribute) => [attribute.name, attribute.owner[attribute.name]]);
        if (this.hasChanges()) entries = Object.keys(this.getChanges()).map((attributeName) => [attributeName, Reflect.get(this, attributeName)]);
        return Object.fromEntries(entries.filter((entry) => !this.getAttribute(entry[0])?.schema.isInternal));
    }

}
