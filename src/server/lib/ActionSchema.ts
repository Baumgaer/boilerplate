import CommonActionSchema from "~common/lib/ActionSchema";
import type SchemaBased from "~server/lib/SchemaBased";

export default class ActionSchema<T extends typeof SchemaBased> extends CommonActionSchema<T> {

    public orderParameters(params: Record<string, string>, query: Record<string, any> = {}, body: Record<string, any> = {}) {
        const parameters = Object.assign({}, body, query, params);
        const orderedParameters: any[] = [];
        for (const parameterKey of Object.keys(parameters)) {
            const index = this.argumentSchemas[parameterKey as keyof InstanceType<T>]?.index;
            if (index === undefined) continue;
            orderedParameters[index] = parameters[parameterKey];
        }
        return orderedParameters;
    }

}
