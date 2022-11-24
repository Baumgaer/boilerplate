import { IonLabel } from "@ionic/vue";
import { defineComponent } from "vue";
import BaseController from "~client/lib/BaseController";

export default defineComponent({
    name: "simple-label",
    components: { IonLabel },
    extends: BaseController,

    props: {
        slot: { type: String },
        name: { type: String }
    }
});
