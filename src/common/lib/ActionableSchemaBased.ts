import { v4 as UUidV4 } from "uuid";
import MetadataStore from "~env/lib/MetadataStore";
import SchemaBased from "~env/lib/SchemaBased";
import { isEqual } from "~env/utils/utils";
import type ModelSchema from "./ModelSchema";
import type RouteSchema from "./RouteSchema";
import type { IExecutedAction } from "~env/@types/ActionSchema";
import type { HttpMethods } from "~env/@types/http";

const metadataStore = new MetadataStore();

export default abstract class ActionableSchemaBased extends SchemaBased {

    private executedActions: IExecutedAction[] = [];

    public constructor(params?: Record<string, any>) {
        super(params);
    }

    /**
     * Looks for the action given by the name and returns its schema
     *
     * @param name the name of the action
     * @returns the schema of the action given by name
     */
    public static getActionSchema<TMethod extends HttpMethods>(name: string, method?: TMethod) {
        let type: "Model" | "Route" = "Model";
        let typeName = "";
        if ("className" in this && typeof this.className === "string") typeName = this.className;
        if ("namespace" in this && typeof this.namespace === "string") {
            type = "Route";
            typeName = this.namespace;
        }

        const schema = this.getSchema(type, typeName) as ModelSchema<any> | RouteSchema<any>;
        if (schema) {
            if (method) {
                return (schema as RouteSchema<any>).getActionSchema(name, method) || null;
            } else return schema.getActionSchema(name) || null;
        }
        return null;
    }

    /**
     * @see ActionableSchemaBased.getActionSchema
     */
    public getActionSchema(name: string, method?: HttpMethods) {
        return (this.constructor as typeof ActionableSchemaBased).getActionSchema(name, method);
    }

    /**
     * returns the action instance identified by the current model instance
     * and the given name
     *
     * @param name the name of the action
     * @returns the unique initialized action owned by this model instance and identified by the given name
     */
    public getAction(name: string) {
        return metadataStore.getInstance<any, "Action">("Action", this, name) || null;
    }

    public getActions() {
        return metadataStore.getInstances<any, "Action">("Action", this);
    }

    public addExecutedAction(name: string, args: Record<string, any>) {
        this.executedActions.push({ name, args, id: UUidV4() });
    }

    public getExecutedActions() {
        return this.executedActions.slice();
    }

    public getExecutedActionsByName(name: string) {
        return this.getExecutedAction("name", name);
    }

    public getExecutedActionsById(id: string) {
        return this.getExecutedAction("id", id);
    }

    public getExecutedActionsByArgs(args: Record<string, any>) {
        return this.getExecutedAction("args", args);
    }

    public resetExecutedActions() {
        this.executedActions = [];
    }

    private getExecutedAction<K extends keyof IExecutedAction>(key: K, value: IExecutedAction[K]) {
        return this.executedActions.filter((executedAction) => isEqual(executedAction[key], value));
    }
}
