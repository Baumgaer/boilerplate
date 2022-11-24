import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from "@ionic/vue";
import { defineComponent } from "vue";
import SimpleAccordion from "~client/components/SimpleAccordion.vue";
import SimpleButton from "~client/components/SimpleButton.vue";
import SimpleIcon from "~client/components/SimpleIcon.vue";
import SimpleItem from "~client/components/SimpleItem.vue";
import SimpleLabel from "~client/components/SimpleLabel.vue";
import BaseController from "~client/lib/BaseController";
import AnotherExample from "~client/models/AnotherExample";

export default defineComponent({
    name: "home-page",
    components: { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, SimpleButton, SimpleIcon, SimpleAccordion, SimpleItem, SimpleLabel },
    extends: BaseController,

    data() {
        return {
            model: new AnotherExample({ name: "waddehaddeduddeda", anotherExampleClient: [1, 2, 3] })
        };
    },

    mounted() {
        console.log(this.model, this.model.toObject());
    }
});
