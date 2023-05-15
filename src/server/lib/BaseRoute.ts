import fs from "fs";
import { fileTypeFromBuffer } from "file-type";
import { isHttpError } from "http-errors";
import CommonBaseRoute from "~common/lib/BaseRoute";
import { BaseError, Forbidden, InternalServerError, NotAcceptable, NotFound } from "~server/lib/Errors";
import { isValue } from "~server/utils/utils";
import type ActionSchema from "~server/lib/ActionSchema";
import type BaseModel from "~server/lib/BaseModel";
import type BaseServer from "~server/lib/BaseServer";
import type Train from "~server/lib/Train";

export default class BaseRoute extends CommonBaseRoute {

    protected server: BaseServer;

    public constructor(server: BaseServer) {
        super(server);
        this.server = server;
    }

    public async handle<T extends typeof BaseRoute>(train: Train<typeof BaseModel>, schema: ActionSchema<T>) {
        try {
            if (!schema.accessRight(train.user, train)) throw new Forbidden();
            if (!schema.descriptor.value) throw new NotFound();

            const validationResult = schema.validateArgumentSchemas(Object.assign({}, train.params));
            if (!validationResult.success) throw new AggregateError(validationResult.errors);

            const orderedParameters = schema.orderParameters(train.params);
            orderedParameters[0] = train;
            const result = await schema.descriptor.value.call(this, ...orderedParameters);

            const response = train.getOriginalResponse();
            if (!isValue(result)) {
                // Nothing was returned, so we assume, that the content is empty
                // if no other status code was set
                const code = response.statusCode;
                response.status(code === 200 ? 204 : code).json({}); // no content
            } else if (typeof result === "boolean") {
                // When a boolean was set, we assume, that the request was
                // accepted or not depending on boolean
                if (!result) {
                    train.next(new NotAcceptable());
                } else response.status(202).json({}); // accepted
            } else if (result instanceof fs.ReadStream) {
                result.pipe(response);
            } else if (typeof result === "string" || result instanceof Buffer) {
                // Normally a string will be returned if we want to send a page
                // (html or text). It is also possible to send a file here,
                // especially when the result is a buffer.
                // In this case the content type has to be set manually.
                if (result instanceof Buffer && !response.getHeader("Content-Type")) {
                    const type = await fileTypeFromBuffer(result);
                    if (!type) {
                        response.setHeader("ContentType", "application/octet-stream");
                    } else response.setHeader("Content-Type", type.mime);
                }
                response.send(result);
            } else if (typeof result === "object") {
                // This is a general response. Normally all responses should be
                // a JSON since this is a rest service.
                response.json(result);
            } else if (typeof result === "number") {
                // A number means we just want to have a certain response code with no content
                response.sendStatus(result);
            } else if (isValue(result)) {
                // A return value which is not allowed is returned. This has to
                // be printed with full trace because it's just wrong...
                train.next(new InternalServerError(`Unacceptable result: ${JSON.stringify(result)}`));
            }
        } catch (error) {
            if (error instanceof BaseError || error instanceof AggregateError || isHttpError(error)) {
                const originalResponse = train.getOriginalResponse();
                if (error instanceof BaseError || isHttpError(error)) originalResponse.status(error.status);
                if (error instanceof AggregateError) originalResponse.status(500);
                originalResponse.send("errors" in error ? error.errors : error);
            } else train.next(new InternalServerError());
        }

    }

    protected async finish() {
        // magic
    }

}
