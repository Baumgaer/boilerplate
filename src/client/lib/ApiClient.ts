import Configurator from "~client/lib/Configurator";
import CommonApiClient from "~common/lib/ApiClient";
import type { TargetComponents } from "~client/@types/ApiClient";

const configurator = new Configurator();

export default class ApiClient extends CommonApiClient {

    protected static override getRequestMode() {
        return configurator.get("client.cors.enable") ? configurator.get("client.cors.policy") as RequestMode : "no-cors";
    }

    protected static override buildTarget({ collectionName, actionName, id, parameters }: TargetComponents) {
        const result = super.buildTarget({ collectionName, actionName, id, parameters });
        const serverFQDN = configurator.get("config.serverFQDN");
        const url = new URL(result, serverFQDN);
        return url.toString();
    }
}
