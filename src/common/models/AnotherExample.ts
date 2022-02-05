import Example from "~env/models/Example";
import { Attr } from "~common/utils/decorators";

export default abstract class AnotherExample extends Example {

    @Attr()
    protected anotherExampleCommon!: number[];
}
