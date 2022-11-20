import { IonButton } from "@ionic/vue";
import SimpleIcon from "~client/components/SimpleIcon.vue";
import BaseController from "~client/lib/BaseController";
import { Controller, Prop } from "~client/utils/decorators";

@Controller({ name: "Simple-button", components: { SimpleIcon, IonButton } })
export default class SimpleButton extends BaseController {

    @Prop({ default: "false" })
    public disabled!: string;

    @Prop()
    public icon!: string;

    @Prop()
    public expand!: "full" | "block";

    @Prop()
    public shape!: "round";

    @Prop()
    public fill!: "clear" | "outline" | "solid";

    @Prop({ default: "default" })
    public size!: "small" | "default" | "large";

    @Prop()
    public color!: "primary" | "secondary" | "tertiary" | "success" | "warning" | "danger" | "light" | "medium" | "dark";

    @Prop({ default: "defaultButton" })
    public class!: string;

}
