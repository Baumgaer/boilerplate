import { Entity, Index, TableInheritance, ChildEntity } from "typeorm";
import ActionableSchema from "~env/lib/ActionableSchema";
import { Model } from "~env/lib/DataTypes";
import { baseTypeFuncs } from "~env/utils/schema";
import type { ModelLike, ModelOptions } from "~env/@types/ModelClass";
import type ActionSchema from "~env/lib/ActionSchema";
import type AttributeSchema from "~env/lib/AttributeSchema";
import type BaseModel from "~env/lib/BaseModel";
import type { LazyType, ObjectType, Type } from "~env/utils/schema";

/**
 * defines the schema for any Model by defining:
 *
 * - the name of the model and of its collection
 * - if its abstract and
 * - all attributes
 *
 * A Model schema will be Initialized by the @Model() decorator.
 *
 * NOTE: If you are working with an ModelSchema at construction time, you have to
 * take care of the status given by the method "awaitConstruction".
 * If the promise is resolved, the construction of the schema is complete and
 * contains the relation. Otherwise the relation might be missing.
 *
 * @template T The model where the schema of the model belongs to
 */
export default class ModelSchema<T extends ModelLike> extends ActionableSchema<T> {

    /**
     * Provides the possibility to check if a value is a model schema.
     * HINT: This is mainly provided to avoid import loops. You should prefer
     * the usual instanceof check if possible.
     */
    public readonly isModelSchema: boolean = true;

    /**
     * The name of the database table where all the models of this type are stored
     */
    public readonly collectionName: string;

    /**
     * Indicates if the model is an abstract class which enables single
     * table inheritance
     */
    public readonly isAbstract: boolean;

    /**
     * Holds a list of all attribute schemas related to the model schema
     */
    public readonly attributeSchemas: Readonly<Record<keyof InstanceType<T>, AttributeSchema<T>>> = {} as Readonly<Record<keyof InstanceType<T>, AttributeSchema<T>>>;

    /**
     * @InheritDoc
     */
    declare public readonly options: ModelOptions<T>;

    /**
     * @InheritDoc
     */
    protected override schemaType: LazyType<ObjectType<any>> = baseTypeFuncs.lazy(this.buildSchemaType.bind(this));

    public constructor(ctor: T, name: string, attributeSchemas: AttributeSchema<T>[], actionSchemas: ActionSchema<T>[], options: ModelOptions<T>) {
        super(ctor, name, ctor.name, actionSchemas, options);
        this.collectionName = options.collectionName as string;
        this.isAbstract = options.isAbstract as boolean;

        for (const attributeSchema of attributeSchemas) this.setAttributeSchema(attributeSchema);
        this.applyEntity();
    }

    /**
     * @InheritDoc
     *
     * @returns The generated schema type
     */
    public getSchemaType() {
        return this.schemaType;
    }

    /**
     * returns the schema of the attribute given by name
     *
     * @param name the name of the attribute
     * @returns the schema of the attribute
     */
    public getAttributeSchema(name: string): AttributeSchema<T> {
        return Reflect.get(this.attributeSchemas, name);
    }

    /**
     * Changes the attributes object in an controlled way using the name of the
     * given schema
     *
     * @param schema the schema to set
     * @returns true if it was set and false else
     */
    public setAttributeSchema(schema: AttributeSchema<T>) {
        return Reflect.set(this.attributeSchemas, schema.name, schema);
    }

    /**
     * @InheritDoc
     */
    public validate(value: unknown) {
        const getAttribute = (name: string) => {
            return this.getAttributeSchema(name) as unknown as AttributeSchema<typeof BaseModel>;
        };

        return Model({ name: this.name, getAttribute }).validate(value);
    }

    /**
     * This will be called by the ZodLazyType which is already applied
     * to the schemaType. This will build the schema on-the-fly to be able to
     * create recursive and circular schema types for this model schema.
     *
     * NOTE: This assumes that all models are already be loaded because the
     * attribute schemas have the same assumption. This allows the lazy type to
     * be built which then allows circular schemas.
     *
     * @InheritDoc
     *
     * @returns at least an empty ZodObjectType
     */
    protected buildSchemaType() {
        const attributeSchemas = Object.values(this.attributeSchemas);
        const members = {} as Record<keyof T, Type>;
        for (const attributeSchema of attributeSchemas) {
            members[attributeSchema.name] = attributeSchema.getSchemaType();
        }

        return baseTypeFuncs.object(members);
    }

    /**
     * Activates the schema when all attribute schemas are constructed.
     * It also decides wether the schema becomes a child entity or introduces
     * table inheritance as well as the type of the index used in the database.
     */
    private async applyEntity() {
        // Wait for all attribute schemas constructed to ensure order of decorators
        await Promise.all(Object.values(this.attributeSchemas).map((attributeSchema) => attributeSchema.awaitConstruction()));
        const proto: typeof BaseModel = Object.getPrototypeOf(Object.getPrototypeOf(Object.getPrototypeOf(this.owner)));
        const options = Object.assign({}, this.options, { name: this.options.collectionName });

        if (proto?.getSchema?.()?.isAbstract) {
            ChildEntity(this.name)(this.owner);
        } else if (this.isAbstract) {
            Entity(options.collectionName, options)(this.owner);
            TableInheritance({ column: { type: "varchar", name: "className" } })(this.owner);
        } else Entity(options.collectionName, options)(this.owner);
        if (options.indexes) for (const index of options.indexes) Index(index.columns, index.options)(proto);
        this._constructed = true;
    }
}
