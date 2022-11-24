import { defineComponent } from "vue";
import { translate, changeLanguage } from "~client/utils/language";
import type { context } from "~client/@types/Language";

export default defineComponent({
    data() {
        return {
            lngChange: 0
        };
    },
    methods: {
        translate(key: string, context: context = {}): string {
            this.lngChange; // to be able to use live updates when language is changed
            return translate(key, context);
        },
        changeLanguage(lng: string) {
            changeLanguage(lng);
            this.lngChange += 1; // triggers live update of whole page
        }
    }
});
