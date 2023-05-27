import { expect } from "chai";
import { v4 } from "uuid";
import ApiClient from "~env/lib/ApiClient";
import Configurator from "~env/lib/Configurator";
import TestModel from "~env/models/TestModel";

const configurator = new Configurator();
const testModel = new TestModel();

export default function (_environment = "common") {
    describe('BaseAction', () => {

        afterEach(() => {
            ApiClient.lastRequestParams = null;
        });

        it("should send a GET request", () => {
            testModel.getActionSchema("testQueryAction")?.updateOptions({ local: false });
            const uuid = v4() as UUID;

            try {
                testModel.testQueryAction(uuid, "test", { prop1: "test" });
            } catch (error) {
                // intentionally do nothing
            }

            const target = ApiClient.lastRequestParams?.target;
            const method = ApiClient.lastRequestParams?.method;
            const baseUrl = configurator.get("config.serverFQDN");

            expect(method).to.be.equal("GET");
            expect(target).to.include(`${baseUrl}/testModels/${uuid}/testQueryAction`);
            expect(target).to.include(`param1=%22test%22`);
            expect(target).to.include(`param2={%22prop1%22:%22test%22}`);
        });

        it("shouldn't send a GET request", () => {
            testModel.getActionSchema("testQueryAction")?.updateOptions({ local: true });
            const uuid = v4() as UUID;

            try {
                testModel.testQueryAction(uuid, "test", { prop1: "test" });
            } catch (error) {
                // intentionally do nothing
            }

            expect(ApiClient.lastRequestParams).to.be.null;
        });

        it.skip("should send a POST request", () => {
            testModel.getActionSchema("testMutationAction")?.updateOptions({ local: false });
            const uuid = v4() as UUID;

            try {
                testModel.testMutationAction(uuid, "test");
            } catch (error) {
                // intentionally do nothing
            }

            expect(ApiClient.lastRequestParams?.method).to.be.equal("POST");
        });

        it.skip("should send a PATCH request", () => {
            testModel.getActionSchema("testMutationAction")?.updateOptions({ httpMethod: "PATCH" });
            const uuid = v4() as UUID;

            try {
                testModel.testMutationAction(uuid, "test");
            } catch (error) {
                // intentionally do nothing
            }

            expect(ApiClient.lastRequestParams?.method).to.be.equal("PATCH");
        });
    });
}
