
import { IonItem } from "@ionic/vue";
import { defineComponent } from "vue";
import SimpleLabel from "~client/components/SimpleLabel.vue";
import BaseController from "~client/lib/BaseController";

export default defineComponent({
    name: "simple-item",
    components: { SimpleLabel, IonItem },
    extends: BaseController,

    props: {
        name: { type: String }
    }
});
