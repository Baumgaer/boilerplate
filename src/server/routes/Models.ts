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

    @Mutation({ name: "/:id/:action", accessRight: () => true })
    public async handleInstanceMutation(train: Train<typeof BaseModel>, @Arg() collection: string, @Arg() action: string, @Arg({ primary: true }) id: UUID, @Arg({ kind: "body" }) body: Record<string, any>) {
        return this.handleRequest(train, collection, action, body, id);
    }

    @Mutation({ name: "/:action", accessRight: () => true })
    public async handleStaticMutation(train: Train<typeof BaseModel>, @Arg() collection: string, @Arg() action: string, @Arg({ kind: "body" }) body: Record<string, any>) {
        return this.handleRequest(train, collection, action, body);
    }

    protected async handleRequest(train: Train<typeof BaseModel>, collection: string, action: string, data: Record<string, any>, id?: UUID) {
        const [model, actionSchema] = await this.getModelActionSchema(train, collection, action, id);
        if (!actionSchema || !actionSchema.descriptor.value) throw new NotFound();

        if (model instanceof BaseModel) train.setHead(model);
        if (!actionSchema.accessRight(train.user, train.head)) throw new Forbidden();

        const orderedParameters = actionSchema.orderParameters(undefined, undefined, data);
        const result = await actionSchema.descriptor.value.call(model, ...orderedParameters);

        if (this.isBatchAccess) return [model, result];

        if (result instanceof BaseModel) result.save();
        if (model instanceof BaseModel) model.save();

        return result;
    }

    protected async getModelActionSchema(train: Train<typeof BaseModel>, collection: string, action: string, id?: UUID) {
        const map = getCollectionNameToModelMap();
        const ModelClass = map[collection];
        if (!ModelClass) return [null, null] as const;

        if (id) {
            const model = await ModelClass.getById(id);
            if (!model) return [null, null] as const;
            return [model, model.getActionSchema(action)] as const;
        }

        return [ModelClass, ModelClass.getActionSchema(action)] as const;
    }

}
