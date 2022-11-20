import BaseController from "~client/lib/BaseController";
import { Controller, Prop } from "~client/utils/decorators";

@Controller({ name: "Simple-accordion" })
export default class SimpleAccordion extends BaseController {

    @Prop({ default: "false" })
    public disabled!: string;

}
