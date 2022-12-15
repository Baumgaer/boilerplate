import type { DataSourceOptions } from "typeorm";
import type { App } from "vue";

export interface IMain {
    appExtension?: (app: App<Element>) => void;
    dataSourceOptions?: DataSourceOptions;
}
