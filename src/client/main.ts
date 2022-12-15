import "reflect-metadata";
import { IonicVue } from '@ionic/vue';
import * as Icons from 'ionicons/icons';
import { DataSource } from "typeorm";
import { createApp } from 'vue';
import App from '~client/App.vue';
import Configurator from "~client/lib/Configurator";
import router from '~client/routes';
import type { DataSourceOptions } from "typeorm";
import type { IMain } from "~client/@types/main";

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

export default async function main(params?: IMain) {
    const configurator = new Configurator();

    global.MODEL_NAME_TO_MODEL_MAP = {};
    const context = require.context("~env/models/", true, /.+\.ts/, "sync");
    context.keys().forEach((key) => {
        global.MODEL_NAME_TO_MODEL_MAP[key.substring(2, key.length - 3)] = context(key).default;
    });

    const sqlWasm = await new URL('sql.js/dist/sql-wasm.wasm', import.meta.url);

    // Wait for all model schemas constructed to ensure all models have correct relations
    const modelClasses = Object.values(global.MODEL_NAME_TO_MODEL_MAP);
    await Promise.all(modelClasses.map((modelClass) => modelClass.getSchema()?.awaitConstruction()));

    await new DataSource(Object.assign(configurator.get("databases.web") as DataSourceOptions, {
        entities: modelClasses,
        sqlJsConfig: {
            locateFile: () => sqlWasm.href
        }
    }, params?.dataSourceOptions ?? {})).initialize();

    const app = createApp(App).use(IonicVue).use(router);
    params?.appExtension?.(app);
    for (const iconName in Icons) {
        if (Object.prototype.hasOwnProperty.call(Icons, iconName)) {
            // eslint-disable-next-line import/namespace
            const icon = (Icons as any)[iconName];
            app.component(icon);
        }
    }
    await router.isReady();
    app.mount('#app');
}

// @ts-expect-error parents is not part of a declaration file
if (!require.main?.parents?.length) main();
