import BaseModel from "~client/lib/BaseModel";
import CommonSpec from "~common/index.spec";

describe("Tests", () => {
    before("register models", async () => {
        const MODEL_NAME_TO_MODEL_MAP = { BaseModel };
        if (global.MODEL_NAME_TO_MODEL_MAP) {
            Object.assign(global.MODEL_NAME_TO_MODEL_MAP, MODEL_NAME_TO_MODEL_MAP);
        } else global.MODEL_NAME_TO_MODEL_MAP = MODEL_NAME_TO_MODEL_MAP;
        const modelClasses = Object.values(MODEL_NAME_TO_MODEL_MAP);
        await Promise.all(modelClasses.map((modelClass) => modelClass.getSchema()?.awaitConstruction()));
    });

    CommonSpec("client");

    describe("Client", () => {
        // Add tests here
    });
});
