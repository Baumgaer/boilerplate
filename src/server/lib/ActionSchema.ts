import CommonActionSchema from "~common/lib/ActionSchema";
import type SchemaBased from "~server/lib/SchemaBased";

export default class ActionSchema<T extends typeof SchemaBased> extends CommonActionSchema<T> {

    public orderParameters(params: Record<string, string> = {}, query: Record<string, any> = {}, body: Record<string, any> = {}) {
        // clone parameters to prevent side effects
        params = Object.assign({}, params);
        query = Object.assign({}, query);
        body = Object.assign({}, body);

        // Merge all together for better iteration
        const parameters = Object.assign({}, query, body, params);
        const orderedParameters: any[] = [];
        for (const argumentSchema of Object.values(this.argumentSchemas)) {
            const { index, kind, name } = argumentSchema;
            if (index === undefined || kind === undefined) continue;
            if (kind === "body") {
                orderedParameters[index] = body;
            } else if (kind === "query") {
                orderedParameters[index] = query;
            } else {
                orderedParameters[index] = parameters[name];
                delete body[name];
                delete query[name];
            }
        }
        return orderedParameters;
    }

}
