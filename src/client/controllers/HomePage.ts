import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from "@ionic/vue";
import { Vue, Options } from "vue-property-decorator";

@Options({ components: { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } })
export default class HomePage extends Vue { }
