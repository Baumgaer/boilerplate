import { Vue, Provide, Inject } from "vue-property-decorator";
import { Controller } from "~client/utils/decorators";
import { translate, changeLanguage } from "~client/utils/language";
import type { context } from "~client/@types/Language";

@Controller()
export default class BaseController extends Vue {

    @Provide()
    @Inject()
    private lngChange: number = 0;

    public translate(key: string, context: context = {}): string {
        this.lngChange; // to be able to use live updates when language is changed
        return translate(key, context);
    }

    public changeLanguage(lng: string) {
        changeLanguage(lng);
        this.lngChange += 1; // triggers live update of whole page
    }
}
