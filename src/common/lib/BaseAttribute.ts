import { v4 as uuid } from "uuid";
import type BaseModel from "~common/lib/BaseModel";
import type AttributeSchema from "~common/lib/AttributeSchema";
import type { Constructor } from "type-fest";

export default abstract class BaseAttribute<T extends BaseModel> {

    public readonly id: string = uuid();

    public readonly owner: T;

    public readonly name: keyof T;

    public readonly schema: AttributeSchema<Constructor<T>>;

    public constructor(owner: T, name: keyof T, attributeSchema: AttributeSchema<Constructor<T>>) {
        this.owner = owner;
        this.name = name;
        this.schema = attributeSchema;
    }

    public get() {
        //
    }

    public set(_value: T[typeof this["name"]]) {
        //
    }
}
