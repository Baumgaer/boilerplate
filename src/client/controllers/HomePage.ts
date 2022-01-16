import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from "@ionic/vue";
import { Controller } from "~client/utils/decorators";
import BaseController from "~client/lib/BaseController";

@Controller({ components: { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } })
export default class HomePage extends BaseController { }
