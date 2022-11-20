import BaseController from "~client/lib/BaseController";
import { Controller, Prop } from "~client/utils/decorators";

@Controller({ name: "Simple-label" })
export default class SimpleLabel extends BaseController {

    @Prop()
    public slot!: string;

    @Prop()
    public name!: string;
}
