import { IonAccordion } from "@ionic/vue";
import { defineComponent } from "vue";
import BaseController from "~client/lib/BaseController";
import type { PropType } from "vue";


export default defineComponent({
    name: "simple-accordion",
    components: { IonAccordion },
    extends: BaseController,

    props: {
        disabled: { type: String as PropType<"true" | "false">, default: "false" }
    }
});

