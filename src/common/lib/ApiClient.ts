import { isArray } from "~env/utils/utils";
import type { RequestParams, MethodParams, TargetComponents } from "~common/@types/ApiClient";

export default class ApiClient {

    public static get({ collectionName, actionName, id, parameters, headers }: Omit<MethodParams, "data">) {
        const target = this.buildTarget({ actionName, collectionName, id, parameters });
        return this.request({ target, method: "GET", headers });
    }

    public static post({ collectionName, actionName, id, parameters, headers, data }: MethodParams) {
        const target = this.buildTarget({ actionName, collectionName, id, parameters });
        return this.request({ target, method: "POST", headers, data });
    }

    public static put({ collectionName, actionName, id, parameters, headers, data }: MethodParams) {
        const target = this.buildTarget({ actionName, collectionName, id, parameters });
        return this.request({ target, method: "PUT", headers, data });
    }

    public static patch({ collectionName, actionName, id, parameters, headers, data }: MethodParams) {
        const target = this.buildTarget({ actionName, collectionName, id, parameters });
        return this.request({ target, method: "PATCH", headers, data });
    }

    public static delete({ collectionName, actionName, id, parameters, headers, data }: MethodParams) {
        const target = this.buildTarget({ actionName, collectionName, id, parameters });
        return this.request({ target, method: "DELETE", headers, data });
    }

    public static options({ collectionName, actionName, id, parameters, headers, data }: MethodParams) {
        const target = this.buildTarget({ actionName, collectionName, id, parameters });
        return this.request({ target, method: "OPTIONS", headers, data });
    }

    protected static async request({ method = "GET", data = {}, headers = {}, target = "" }: RequestParams) {
        const defaultHeaders = { redirect: 'follow', mode: 'cors', Accept: "application/json", "Content-Type": "application/json" } as RequestInit;
        const fetchObject = { method, headers: Object.assign(headers, defaultHeaders) };

        // HEAD and GET doesn't allow body, so apply body only when method is different
        if (!["GET", "HEAD"].includes(method) && Object.keys(data).length) Object.assign(fetchObject, { body: JSON.stringify(data) });

        const response = await fetch(target, fetchObject);

        // Errors can be receives as JSON or text, so we have to pass the whole response
        if (response.status >= 400) return this.handleHttpError(response);

        if (response.headers.get("Content-Type")?.includes("application/json")) {
            // In case of a normal "model call" we will get back an array which
            // contains at first the called model followed by possible wasted objects
            const handledModels = this.handleModels(await response.json());
            if (isArray(handledModels)) return handledModels[0];
            return handledModels;
        }
        return {};
    }

    protected static handleHttpError(_response: Response) {
        throw new Error("Not implemented");
    }

    protected static handleModels(_result: unknown) {
        throw new Error("Not implemented");
    }

    private static buildTarget({ collectionName, actionName, id, parameters = [] }: TargetComponents) {
        let target = `${collectionName}`;
        if (id) target += `/${id}`;
        target += `/${actionName}`;
        if (parameters.length) target += `?${parameters.map((parameter) => `${parameter[0]}=${parameter[1]}`).join("&")}`;
        return target;
    }
}