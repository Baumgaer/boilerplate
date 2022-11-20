import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from "@ionic/vue";
import SimpleAccordion from "~client/components/SimpleAccordion.vue";
import SimpleButton from "~client/components/SimpleButton.vue";
import SimpleIcon from "~client/components/SimpleIcon.vue";
import SimpleItem from "~client/components/SimpleItem.vue";
import SimpleLabel from "~client/components/SimpleLabel.vue";
import BaseController from "~client/lib/BaseController";
import AnotherExample from "~client/models/AnotherExample";
import { Controller } from "~client/utils/decorators";

@Controller({ components: { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, SimpleButton, SimpleIcon, SimpleAccordion, SimpleItem, SimpleLabel }, name: "home-page" })
export default class HomePage extends BaseController {

    public model: AnotherExample = new AnotherExample({ name: "waddehaddeduddeda", anotherExampleClient: [1, 2, 3] });

    public override mounted() {
        console.log(this.model, this.model.toObject());
    }
}
