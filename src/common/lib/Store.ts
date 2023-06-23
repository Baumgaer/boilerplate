import { getModelNameToModelMap } from "~env/utils/schema";
import { isEqual } from "~env/utils/utils";
import type { ModelChanges } from "~env/@types/BaseModel";
import type { MinimumModel } from "~env/@types/ModelClass";
import type BaseModel from "~env/lib/BaseModel";

export default class Store {

    private static instance?: Store;

    private collections: Record<string, Record<UUID, BaseModel>> = {};

    protected constructor() {
        // @ts-expect-error for testing
        global.store = this;
    }

    public static getInstance(): Store {
        if (!this.instance) this.instance = new this();
        return this.instance;
    }

    public getCollection(name: string) {
        if (!this.collections[name]) this.collections[name] = {};
        return this.collections[name];
    }

    public getModelById(collectionName: string, id: UUID) {
        const model = this.getCollection(collectionName)?.[id];
        if (!model) return null;
        return model;
    }

    public getModelsBy(params: Record<string, any>) {
        const models: BaseModel[] = [];
        const paramsEntries = Object.entries(params);

        const iterateCollection = (collectionName: string) => {
            const collection = this.getCollection(collectionName);
            if (params.id && typeof params.id === "string" && !collection[params.id as UUID]) return;
            if (params.dummyId && typeof params.dummyId === "string" && !collection[params.dummyId as UUID]) return;
            for (const model of Object.values(collection)) {
                const isValid = paramsEntries.every(param => param[0] in model && isEqual(Reflect.get(model, param[0]), param[1]));
                if (isValid) models.push(model);
            }
        };

        if (params.collectionName && typeof params.collectionName === "string") {
            iterateCollection(params.collectionName);
        } else for (const collectionName of Object.keys(this.collections)) iterateCollection(collectionName);

        return models;
    }

    public addModel(model: BaseModel | MinimumModel) {
        if (this.hasModel(model)) return null;

        const { className, collectionName, id, dummyId } = model;
        const modelId = id ?? dummyId;
        const ModelClass = getModelNameToModelMap(className);

        if (ModelClass) {
            if (!(model instanceof ModelClass)) model = new (ModelClass as any)(model);

            if (model instanceof ModelClass) {
                const collection = this.getCollection(collectionName);
                if (modelId) collection[modelId] = model;
                return model;
            }
        }

        return null;
    }

    public removeModel(model: BaseModel | MinimumModel) {
        if (this.hasModel(model)) {
            const id = model.id ?? model.dummyId ?? "" as UUID;
            delete this.getCollection(model.collectionName)[id];
        }
    }

    public updateModel(model: BaseModel | MinimumModel, changes: ModelChanges<any>) {
        if (this.hasModel(model)) {
            const id = model.id ?? model.dummyId ?? "" as UUID;
            const existing = this.getModelById(model.collectionName, id);
            if (existing) model = existing;
        } else {
            const added = this.addModel(model);
            if (added) model = added;
        }

        if ("isBaseModel" in model && model.isBaseModel) {
            model.applyChanges(changes);
            return model;
        }

        return null;
    }

    public hasModel(model: BaseModel | MinimumModel) {
        if (!model.id && !model.dummyId) return false;
        return Boolean(this.getModelById(model.collectionName, model.id ?? model.dummyId ?? "" as UUID));
    }
}
