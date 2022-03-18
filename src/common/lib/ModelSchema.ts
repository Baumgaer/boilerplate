import { Entity } from "typeorm";
import type AttributeSchema from "~common/lib/AttributeSchema";
import type BaseModel from "~common/lib/BaseModel";
import type { ModelOptions } from "~common/types/ModelClass";

export default class ModelSchema<T extends typeof BaseModel> {

    public readonly ctor: T;

    public readonly modelName: string;

    public readonly attributeSchemas = {} as Readonly<Record<keyof InstanceType<T>, AttributeSchema<T>>>;

    public readonly options: any;

    private _constructed = false;

    public constructor(ctor: T, name: string, schemas: AttributeSchema<T>[], options: ModelOptions<T>) {
        this.ctor = ctor;
        this.modelName = name;
        this.options = options;

        for (const schema of schemas) this.setAttributeSchema(schema);
        this.applyEntity();
    }

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
        Entity(this.options.collectionName, this.options)(this.ctor);
        this._constructed = true;
    }
}
