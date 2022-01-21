import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from "@ionic/vue";
import { Controller } from "~client/utils/decorators";
import BaseController from "~client/lib/BaseController";
import Example from "~client/models/Example";

@Controller({ components: { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } })
export default class HomePage extends BaseController {

    override mounted() {
        new Example();
    }
}
