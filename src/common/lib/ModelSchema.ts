import type AttributeSchema from "~common/lib/AttributeSchema";
import type BaseModel from "~common/lib/BaseModel";

export default class ModelSchema<T extends typeof BaseModel> {

    public readonly ctor: T;

    public readonly modelName: string;

    public readonly attributeSchemas = {} as Readonly<Record<keyof InstanceType<T>, AttributeSchema<T>>>;

    public constructor(ctor: T, name: string, schemas: AttributeSchema<T>[]) {
        this.ctor = ctor;
        this.modelName = name;

        for (const schema of schemas) this.setAttributeSchema(schema);
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
}
