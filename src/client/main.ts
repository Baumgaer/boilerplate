import "reflect-metadata";
import App from '~client/App.vue';
import router from '~client/routes';
import { pascalCase } from "~client/utils/utils";
import { createApp } from 'vue';

import { IonicVue } from '@ionic/vue';

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/* Theme variables */
import '~client/themes/default.css';

/* Web database */
import "sql.js/dist/sql-wasm.js";
import { createConnection } from "typeorm";

global.MODEL_NAME_TO_MODEL_MAP = {};
const context = require.context("~env/models/", true, /.+\.ts/, "sync");
context.keys().forEach((key) => {
    global.MODEL_NAME_TO_MODEL_MAP[pascalCase(key.substring(2, key.length - 3))] = context(key).default;
});

const sqlWasm = await new URL('sql.js/dist/sql-wasm.wasm', import.meta.url);
createConnection({
    type: "sqljs",
    autoSave: true,
    location: "test",
    useLocalForage: true,
    entities: Object.values(global.MODEL_NAME_TO_MODEL_MAP),
    synchronize: true,
    sqlJsConfig: {
        locateFile: () => sqlWasm.href
    }
});

const app = createApp(App)
    .use(IonicVue)
    .use(router);

router.isReady().then(() => {
    app.mount('#app');
});
