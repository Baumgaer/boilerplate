import { IonIcon } from "@ionic/vue";
import * as Icons from 'ionicons/icons';
import { defineComponent } from "vue";
import BaseController from "~client/lib/BaseController";

export default defineComponent({
    name: "simple-icon",
    components: { IonIcon },
    extends: BaseController,

    props: {
        slot: { type: String },
        name: { type: String }
    },

    data() {
        return { icons: Icons };
    }
});

