import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from "@ionic/vue";
import BaseController from "~client/lib/BaseController";
import AnotherExample from "~client/models/AnotherExample";
import { Controller } from "~client/utils/decorators";

@Controller({ components: { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } })
export default class HomePage extends BaseController {

    public model = new AnotherExample({ name: "waddehaddeduddeda", anotherExampleClient: [1, 2, 3] });

    public override mounted() {
        console.log(this.model, this.model.toObject());
    }
}
