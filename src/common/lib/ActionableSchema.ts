import Schema from "~env/lib/Schema";
import type ActionSchema from "~env/lib/ActionSchema";
import type SchemaBased from "~env/lib/SchemaBased";

export default abstract class ActionableSchema<T extends typeof SchemaBased> extends Schema<T> {

    /**
     * Holds the class object which created the schema. This is only a valid
     * value after processing the schema of the class!
     */
    public readonly owner: T;

    /**
     * The name of the class in the schema. Corresponds to the model
     * name (maybe not in runtime)
     */
    declare public readonly name: string;

    /**
     * Holds a list of all attribute schemas related to the model schema
     */
    public readonly actionSchemas: Readonly<Record<keyof InstanceType<T>, ActionSchema<T>>> = {} as Readonly<Record<keyof InstanceType<T>, ActionSchema<T>>>;

    public constructor(ctor: T, name: string, actionSchemas: ActionSchema<T>[], options: Record<string, any>) {
        super(name, options);
        this.owner = ctor;

        for (const actionSchema of actionSchemas) this.setActionSchema(actionSchema);
    }

    public getActionSchema(name: keyof InstanceType<T>): ActionSchema<T> {
        return Reflect.get(this.actionSchemas, name);
    }

    public setActionSchema(schema: ActionSchema<T>) {
        return Reflect.set(this.actionSchemas, schema.name, schema);
    }

}