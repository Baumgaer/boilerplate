import CommonModels from "~common/routes/Models";
import BaseModel from "~server/lib/BaseModel";
import { Forbidden, NotFound } from "~server/lib/Errors";
import { Route, Query, Mutation, Arg } from "~server/utils/decorators";
import { getCollectionNameToModelMap } from "~server/utils/schema";
import type BaseServer from "~server/lib/BaseServer";
import type Train from "~server/lib/Train";

@Route({ namespace: "/models/:collection" })
export default class Models extends CommonModels {

    protected isBatchAccess: boolean;

    public constructor(server: BaseServer, isBatchAccess: boolean = false) {
        super(server);
        this.isBatchAccess = isBatchAccess;
    }

    @Query({ name: "/:id/:action", accessRight: () => true })
    public async handleInstanceQuery(train: Train<typeof BaseModel>, @Arg() collection: string, @Arg() action: string, @Arg({ primary: true }) id: UUID, @Arg({ kind: "query" }) query: Record<string, any>) {
        return this.handleRequest(train, collection, action, query, id);
    }

    @Query({ name: "/:action", accessRight: () => true })
    public async handleStaticQuery(train: Train<typeof BaseModel>, @Arg() collection: string, @Arg() action: string, @Arg({ kind: "query" }) query: Record<string, any>) {
        return this.handleRequest(train, collection, action, query);
    }

    @Mutation({ name: "/create", accessRight: () => true })
    public async handleCreate(train: Train<typeof BaseModel>, @Arg() collection: string, @Arg() body: Record<string, any>): Promise<BaseModel> {
        const ModelClass = await this.getModelOrClass(train, collection, "");
        if (!ModelClass || ModelClass instanceof BaseModel) throw new NotFound();

        const schemaValidationResult = ModelClass.getSchema()?.validate(body);
        if (!schemaValidationResult) throw new NotFound();
        if (!schemaValidationResult.success) throw new AggregateError(schemaValidationResult.errors);

        const newModel: BaseModel = new (ModelClass as any)(body);
        if (!this.isBatchAccess) newModel.save();
        return newModel;
    }

    @Mutation({ name: "/:id/:action", accessRight: () => true })
    public async handleInstanceMutation(train: Train<typeof BaseModel>, @Arg() collection: string, @Arg() action: string, @Arg({ primary: true }) id: UUID, @Arg({ kind: "body" }) body: Record<string, any>) {
        return this.handleRequest(train, collection, action, body, id);
    }

    @Mutation({ name: "/:action", accessRight: () => true })
    public async handleStaticMutation(train: Train<typeof BaseModel>, @Arg() collection: string, @Arg() action: string, @Arg({ kind: "body" }) body: Record<string, any>) {
        return this.handleRequest(train, collection, action, body);
    }

    protected async handleRequest(train: Train<typeof BaseModel>, collection: string, action: string, data: Record<string, any>, id?: UUID) {
        const modelOrClass = await this.getModelOrClass(train, collection, action, id);
        if (!modelOrClass) throw new NotFound();

        const theAction = modelOrClass.getAction(action);
        if (!theAction) throw new NotFound();

        if (modelOrClass instanceof BaseModel) train.setHead(modelOrClass);
        if (!theAction.schema.accessRight(train.user, train.head)) throw new Forbidden();

        const orderedParameters = theAction.schema.orderParameters(undefined, undefined, data);
        orderedParameters[0] = train.user;
        const result = theAction.get()(...orderedParameters);

        if (this.isBatchAccess) return [modelOrClass, result];

        if (train.httpMethod !== "GET") {
            if (result instanceof BaseModel) result.save();
            if (modelOrClass instanceof BaseModel) modelOrClass.save();
        }

        return result;
    }

    protected async getModelOrClass(train: Train<typeof BaseModel>, collection: string, action: string, id?: UUID) {
        const ModelClass = getCollectionNameToModelMap(collection);
        if (!ModelClass) return null;

        if (id) return ModelClass.getById(train.user, id);
        return ModelClass;
    }

}
