import CommonExample from "~common/models/Example";
import { Model } from "~server/utils/decorators";
import type ExampleParams from "~server/interfaces/models/Example";

@Model()
export default class Example extends CommonExample {

    public constructor(params?: ExampleParams) {
        super(params);
    }
}
