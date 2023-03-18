import fs from "fs";
import { fileTypeFromBuffer } from "file-type";
import CommonBaseRoute from "~common/lib/BaseRoute";
import { Forbidden, InternalServerError, NotAcceptable, NotFound } from "~server/lib/Errors";
import { isValue } from "~server/utils/utils";
import type { IMinimumRouteObject } from "~server/@types/http";
import type BaseModel from "~server/lib/BaseModel";
import type BaseServer from "~server/lib/BaseServer";
import type Train from "~server/lib/Train";

export default class BaseRoute extends CommonBaseRoute {

    public static readonly namespace: string;

    public readonly namespace!: string;

    protected server: BaseServer;

    public constructor(server: BaseServer) {
        super(server);
        this.server = server;
    }

    public override getRoutes() {
        return [];
    }

    public async handle(train: Train<typeof BaseModel>, routeObject: IMinimumRouteObject) {
        // 1. Check access to route
        // 2. Get Data if ID is given
        // 3. Check access to asked data
        // 4. Check if action exists
        // 5. Process request Data (changes) in given action
        //      - Create new Objects (if allowed)
        //      - Update existing objects (if allowed for each attribute)
        //      - delete removed objects (if allowed)
        // 6. Commit changes to database
        if (!routeObject.accessCheck(train)) return train.next(new Forbidden());
        try {
            if (!routeObject.descriptor.value) return train.next(new NotFound());
            const result = await routeObject.descriptor.value.call(this, train);
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
            if (error instanceof Error) return train.next(error);
            train.next(new InternalServerError());
        }

    }

    protected async finish() {
        // magic
    }

}
