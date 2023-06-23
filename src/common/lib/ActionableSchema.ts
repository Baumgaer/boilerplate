import Schema from "~env/lib/Schema";
import type ActionSchema from "~env/lib/ActionSchema";
import type SchemaBased from "~env/lib/SchemaBased";

export default abstract class ActionableSchema<T extends typeof SchemaBased> extends Schema<T> {

    /**
     * Provides the possibility to check if a value is an actionable schema.
     * HINT: This is mainly provided to avoid import loops. You should prefer
     * the usual instanceof check if possible.
     */
    public readonly isActionableSchema: boolean = true;

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

    public constructor(ctor: T, name: string, internalName: string, actionSchemas: ActionSchema<T>[], options: Record<string, any>) {
        super(name, internalName, options);
        this.owner = ctor;

        for (const actionSchema of actionSchemas) this.setActionSchema(actionSchema);
    }

    public getActionSchema(name: string): ActionSchema<T> | null {
        return Reflect.get(this.actionSchemas, name) || null;
    }

    public setActionSchema(schema: ActionSchema<T>) {
        return Reflect.set(this.actionSchemas, schema.name, schema);
    }

}
