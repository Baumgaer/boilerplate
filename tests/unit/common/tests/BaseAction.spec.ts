import { expect } from "chai";
import { v4 } from "uuid";
import ApiClient from "~env/lib/ApiClient";
import TestModel from "~env/models/TestModel";

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
            expect(method).to.be.equal("GET");
            expect(target).to.include(`testModels/${uuid}/testQueryAction`);
            expect(target).to.include(`param1="test"`);
            expect(target).to.include(`param2={"prop1":"test"}`);
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

        it("should send a POST request", () => {
            testModel.getActionSchema("testMutationAction")?.updateOptions({ local: false });
            const uuid = v4() as UUID;

            try {
                testModel.testMutationAction(uuid, "test");
            } catch (error) {
                // intentionally do nothing
            }

            expect(ApiClient.lastRequestParams?.method).to.be.equal("POST");
        });

        it("should send a PATCH request", () => {
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
