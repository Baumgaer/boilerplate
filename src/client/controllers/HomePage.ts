import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from "@ionic/vue";
import { Controller } from "~client/utils/decorators";
import BaseController from "~client/lib/BaseController";
import AnotherExample from "~client/models/AnotherExample";

@Controller({ components: { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } })
export default class HomePage extends BaseController {

    public model = new AnotherExample();

    public override mounted() {
        console.log(this.model, this.model.toObject());
    }
}
