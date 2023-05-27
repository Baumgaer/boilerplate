import CommonApiClient from "~common/lib/ApiClient";
import Configurator from "~server/lib/Configurator";

const configurator = new Configurator();

export default class ApiClient extends CommonApiClient {

    protected static override getRequestMode() {
        return configurator.get("server.cors.enable") ? configurator.get("server.cors.policy") as RequestMode : "no-cors";
    }
}
