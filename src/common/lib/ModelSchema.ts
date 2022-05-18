import { Entity, Index, TableInheritance, ChildEntity } from "typeorm";
import { baseTypeFuncs } from "~common/utils/schema";
import type { ZodLazy, ZodObject, ZodType } from "zod";
import type { ModelOptions } from "~common/@types/ModelClass";
import type AttributeSchema from "~common/lib/AttributeSchema";
import type BaseModel from "~common/lib/BaseModel";

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
export default class ModelSchema<T extends typeof BaseModel> {

    /**
     * Holds the class object which created the schema. This is only a valid
     * value after processing the schema of the class!
     */
    public readonly owner: T;

    /**
     * The name of the class in the schema. Corresponds to the model
     * name (maybe not in runtime)
     */
    public readonly modelName: string;

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
    public readonly attributeSchemas = {} as Readonly<Record<keyof InstanceType<T>, AttributeSchema<T>>>;

    /**
     * Holds the options of the entity (model) which were used to construct the schema
     */
    public readonly options: ModelOptions<T>;

    /**
     * Holds the "ready to validate" schema of the type
     */
    private schemaType: ZodLazy<ZodObject<any>> = baseTypeFuncs.lazy(this.buildSchemaType.bind(this));

    /**
     * Internal state which determines if the schema is fully built or not
     */
    private _constructed = false;

    public constructor(modelClass: T, name: string, schemas: AttributeSchema<T>[], options: ModelOptions<T>) {
        this.owner = modelClass;
        this.modelName = name;
        this.collectionName = options.collectionName as string;
        this.isAbstract = options.isAbstract as boolean;
        this.options = options;

        for (const schema of schemas) this.setAttributeSchema(schema);
        this.applyEntity();
    }

    /**
     * Returns a promise which resolves when the schema was built the first time.
     * Useful to ensure the correct order of decorator execution during setup.
     *
     * @returns a resolving promise
     */
    public awaitConstruction() {
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (!this._constructed) return;
                clearInterval(interval);
                resolve(true);
            });
        });
    }

    /**
     * returns the schema of the attribute given by name
     *
     * @param name the name of the attribute
     * @returns the schema of the attribute
     */
    public getAttributeSchema(name: keyof InstanceType<T>): AttributeSchema<T> {
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
        return Reflect.set(this.attributeSchemas, schema.attributeName, schema);
    }

    /**
     * Removes the given schema from the attributes object in a controlled way
     * using its name
     *
     * @param schema the schema to remove
     * @returns true if it was removed and false else
     */
    public removeAttributeSchema(schema: AttributeSchema<T>) {
        return Reflect.deleteProperty(this.attributeSchemas, schema.attributeName);
    }

    public getSchemaType() {
        return this.schemaType;
    }

    /**
     * Activates the schema when all attribute schemas are constructed.
     * It also decides wether the schema becomes a child entity or introduces
     * table inheritance as well as the type of the index used in the database.
     */
    private async applyEntity() {
        // Wait for all attribute schemas constructed to ensure order of decorators
        await Promise.all(Object.values(this.attributeSchemas).map((attributeSchema) => attributeSchema.awaitConstruction()));
        const proto: typeof BaseModel = Object.getPrototypeOf(this.owner);
        const options = Object.assign({}, this.options, { name: this.options.collectionName });

        if (proto.getSchema()?.isAbstract) {
            ChildEntity(this.modelName)(this.owner);
        } else if (this.isAbstract) {
            Entity(options.collectionName, options)(this.owner);
            TableInheritance({ column: { type: "varchar", name: "className" } })(this.owner);
        } else Entity(options.collectionName, options)(this.owner);
        if (options.indexes) for (const index of options.indexes) Index(index.columns, index.options)(proto);
        this._constructed = true;
    }

    /**
     * This will be called by the ZodLazyType which is already applied
     * to the schemaType. This will build the schema on-the-fly to be able to
     * create recursive and circular schema types for this model schema.
     *
     * @returns at least an empty ZodObjectType
     */
    private buildSchemaType() {
        const attributeSchemas = Object.values(this.attributeSchemas);
        const members = {} as Record<keyof T, ZodType>;
        for (const attributeSchema of attributeSchemas) {
            members[attributeSchema.attributeName] = attributeSchema.getSchemaType();
        }

        return baseTypeFuncs.object(members);
    }
}
