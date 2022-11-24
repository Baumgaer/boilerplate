import { IonButton } from "@ionic/vue";
import { defineComponent } from "vue";
import SimpleIcon from "~client/components/SimpleIcon.vue";
import BaseController from "~client/lib/BaseController";
import type { PropType } from "vue";

export default defineComponent({
    name: "simple-button",
    components: { SimpleIcon, IonButton },
    extends: BaseController,

    props: {
        disabled: { type: String as PropType<"true" | "false">, default: "false" },
        icon: { type: String },
        expand: { type: String as PropType<"full" | "block"> },
        shape: { type: String as PropType<"round"> },
        fill: { type: String as PropType<"clear" | "outline" | "solid"> },
        size: { type: String as PropType<"small" | "default" | "large">, default: "default" },
        color: { type: String as PropType<"primary" | "secondary" | "tertiary" | "success" | "warning" | "danger" | "light" | "medium" | "dark"> },
        class: { type: String, default: "defaultButton" }
    }
});
