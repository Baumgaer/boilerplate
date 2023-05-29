export interface RequestParams {
    method: RequestInit["method"];
    target: string;
    data?: Record<string, any>;
    headers?: RequestInit["headers"];
}

export interface TargetComponents {
    prefix?: string;
    collectionName: string;
    id: string;
    actionName: string;
    parameters?: [string, any][];
}

export interface MethodParams extends Omit<RequestParams, "target" | "method">, TargetComponents {
    data?: Record<string, any> | Record<string, any>[];
}
