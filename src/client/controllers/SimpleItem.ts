import BaseController from "~client/lib/BaseController";
import { Controller, Prop } from "~client/utils/decorators";

@Controller({ name: "Simple-item" })
export default class SimpleItem extends BaseController {

    @Prop()
    public name!: string;
}
