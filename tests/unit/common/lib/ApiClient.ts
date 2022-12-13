import SrcApiClient from "~src/common/lib/ApiClient";
import type { RequestParams } from "~common/@types/ApiClient";

export default class ApiClient extends SrcApiClient {

    public static lastRequestParams: RequestParams | null;

    protected static override async request(params: RequestParams) {
        this.lastRequestParams = params;
    }
}
