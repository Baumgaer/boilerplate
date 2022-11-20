import { IonIcon } from "@ionic/vue";
import * as Icons from 'ionicons/icons';
import BaseController from "~client/lib/BaseController";
import { Controller, Prop } from "~client/utils/decorators";

@Controller({ name: "Simple-icon", components: { IonIcon } })
export default class SimpleIcon extends BaseController {

    @Prop()
    public slot!: string;

    @Prop()
    public name!: string;

    public override data() {
        console.log("test", Icons);
        return { icons: Icons };
    }
}
