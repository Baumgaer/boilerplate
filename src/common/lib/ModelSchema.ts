import { Entity, Index, TableInheritance, ChildEntity } from "typeorm";
import type AttributeSchema from "~common/lib/AttributeSchema";
import type BaseModel from "~common/lib/BaseModel";
import type { ModelOptions } from "~common/types/ModelClass";

export default class ModelSchema<T extends typeof BaseModel> {

    /**
     * Holds the class object which created the schema. This is only a valid
     * value after processing the schema of the class!
     */
    public readonly modelClass: T;

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
     * Internal state which determines if the schema is fully built or not
     */
    private _constructed = false;

    public constructor(modelClass: T, name: string, schemas: AttributeSchema<T>[], options: ModelOptions<T>) {
        this.modelClass = modelClass;
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

    public getAttributeSchema(name: keyof InstanceType<T>): AttributeSchema<T> {
        return Reflect.get(this.attributeSchemas, name);
    }

    public setAttributeSchema(schema: AttributeSchema<T>) {
        return Reflect.set(this.attributeSchemas, schema.attributeName, schema);
    }

    public removeAttributeSchema(schema: AttributeSchema<T>) {
        return Reflect.deleteProperty(this.attributeSchemas, schema.attributeName);
    }

    private async applyEntity() {
        // Wait for all attribute schemas constructed to ensure order of decorators
        await Promise.all(Object.values(this.attributeSchemas).map((attributeSchema) => attributeSchema.awaitConstruction()));
        const proto: typeof BaseModel = Object.getPrototypeOf(this.modelClass);
        const options = Object.assign({}, this.options, { name: this.options.collectionName });

        if (proto.getSchema()?.isAbstract) {
            ChildEntity(this.modelName)(this.modelClass);
        } else if (this.isAbstract) {
            Entity(options.collectionName, options)(this.modelClass);
            TableInheritance({ column: { type: "varchar", name: "className" } })(this.modelClass);
        } else Entity(options.collectionName, options)(this.modelClass);
        if (options.indexes) for (const index of options.indexes) Index(index.columns, index.options)(proto);
        this._constructed = true;
    }
}
