/* eslint-disable @typescript-eslint/unbound-method */
const childProcess = require("child_process");
const path = require("path");
const arp = require("app-root-path");
const deepDash = require("deepdash");
const { writeFile, copy, readJSONSync, writeJSONSync } = require("fs-extra");
const lodash = require("lodash");
const { get } = require("lodash");
const mkdirp = require("mkdirp");

deepDash(lodash);

const gitKeep = "";

const esLintRC = `{
    "extends": "./node_modules/boilerplate/.eslintrc"
}`;

const gulpFile = `const boilerplateTasks = require("boilerplate/gulpfile").default;

exports.default = boilerplateTasks;`;

const fill = {
    gitKeep,
    esLintRC,
    gulpFile
};

const files = {
    ".husky": "copy",
    android: "copy",
    ios: "copy",
    public: "copy",
    src: {
        client: {
            "@types": { ".gitkeep": "fill gitKeep" },
            attributes: { ".gitkeep": "fill gitKeep" },
            components: {
                "HomePage.vue": "copy"
            },
            configs: {
                default: { ".gitkeep": "fill gitKeep" },
                development: { ".gitkeep": "fill gitKeep" },
                production: { ".gitkeep": "fill gitKeep" }
            },
            controllers: {
                "HomePage.ts": "copy"
            },
            lib: { ".gitkeep": "fill gitKeep" },
            locales: {
                "de-de": { ".gitkeep": "fill gitKeep" },
                "en-us": { ".gitkeep": "fill gitKeep" }
            },
            models: { ".gitkeep": "fill gitKeep" },
            styles: { ".gitkeep": "fill gitKeep" },
            themes: { ".gitkeep": "fill gitKeep" },
            utils: { ".gitkeep": "fill gitKeep" },
            views: {
                "HomePage.html": "copy"
            },
            ".eslintrc": "copy",
            "App.vue": "copy",
            "main.ts": "copy",
            "routes.ts": "copy",
            "shims-vue.d.ts": "copy",
            "tsconfig.json": "copy"
        },
        common: {
            "@types": {
                ".gitkeep": "fill gitKeep",
                "Datatypes.d.ts": "copy"
            },
            attributes: { ".gitkeep": "fill gitKeep" },
            configs: {
                default: { ".gitkeep": "fill gitKeep" },
                development: { ".gitkeep": "fill gitKeep" },
                production: { ".gitkeep": "fill gitKeep" }
            },
            lib: { ".gitkeep": "fill gitKeep" },
            locales: {
                "de-de": { ".gitkeep": "fill gitKeep" },
                "en-us": { ".gitkeep": "fill gitKeep" }
            },
            models: { ".gitkeep": "fill gitKeep" },
            utils: { ".gitkeep": "fill gitKeep" },
            views: { ".gitkeep": "fill gitKeep" },
            ".eslintrc": "fill esLintRC",
            "tsconfig.json": "copy"
        },
        server: {
            "@types": { ".gitkeep": "fill gitKeep" },
            attributes: { ".gitkeep": "fill gitKeep" },
            configs: {
                default: { ".gitkeep": "fill gitKeep" },
                development: { ".gitkeep": "fill gitKeep" },
                production: { ".gitkeep": "fill gitKeep" }
            },
            lib: { ".gitkeep": "fill gitKeep" },
            locales: {
                "de-de": { ".gitkeep": "fill gitKeep" },
                "en-us": { ".gitkeep": "fill gitKeep" }
            },
            models: { ".gitkeep": "fill gitKeep" },
            routes: { ".gitkeep": "fill gitKeep" },
            utils: { ".gitkeep": "fill gitKeep" },
            views: { ".gitkeep": "fill gitKeep" },
            ".eslintrc": "fill esLintRC",
            "tsconfig.json": "copy"
        }
    },
    ".browserslistrc": "copy",
    ".commitlintrc": "copy",
    ".editorconfig": "copy",
    ".eslintrc": "fill esLintRC",
    ".gitignore": "copy",
    ".lintstagedrc": "copy",
    ".mocharc.js": "copy",
    ".nycrc": "copy",
    ".prettierrc": "copy",
    ".stylelintrc": "copy",
    "babel.config.js": "copy",
    "capacitor.config.ts": "copy",
    "cypress.config.ts": "copy",
    "gulpfile.js": "fill gulpFile",
    "ionic.config.json": "copy",
    "tsconfig.json": "copy",
    "typedoc.json": "copy",
    "vue.config.js": "copy"
};

async function init() {
    const promises = [];
    lodash.eachDeep(files, (value, key, parentValue, context) => {
        promises.push(new Promise((resolve) => {
            const [cmd, name] = value.split(" ");
            const dirPath = path.join(...context.path.slice(0, -1));
            const filePath = path.join(dirPath, key);

            mkdirp(dirPath).then(() => {
                if (cmd === "fill") {
                    writeFile(filePath, get(fill, name), { encoding: "utf-8", flag: "w" }).then(resolve);
                } else if (cmd === "copy") {
                    copy(path.join(arp.path, filePath), filePath).then(resolve);
                }
            });

        }));
    }, { pathFormat: "array", leavesOnly: true });
    await Promise.all(promises);

    const ownPackageJSON = readJSONSync(path.join(arp.path, "package.json"), { encoding: "utf-8" });
    const projectPackageJSON = readJSONSync("./package.json", { encoding: "utf-8" });

    lodash.merge(projectPackageJSON, {
        engineStrict: true,
        engines: {
            "npm": "~8.18.0",
            "node": ">= 16.16.0"
        },
        scripts: {
            "dev": "npm-run-all -p dev:!(app)",
            "dev:server": "echo 'no dev:server script'",
            "dev:web": "npm run compile:build:client:config && concurrently \"npm run compile:dev:client:config\" \"vue-cli-service serve --env development --deep-monitoring --source-map-support\"",
            "//1": "",
            "dev:app": "npm run build:web && cap sync && cap run",
            "dev:app:android": "npm run build:web && cap sync && cap run android",
            "dev:app:ios": "npm run build:web && cap sync && cap run ios",
            "//1b": "",
            "compile:dev:server:config": "cross-env NODE_ENV=development TS_CONFIG_PATH=src/server/tsconfig.json ENVIRONMENT=server gulp",
            "compile:dev:client:config": "cross-env NODE_ENV=development TS_CONFIG_PATH=src/client/tsconfig.json ENVIRONMENT=client gulp",
            "//2": "",
            "build": "npm-run-all -p build:!(app)",
            "build:server": "echo 'no build:server script'",
            "build:web": "npm run compile:build:client:config && cross-env NODE_OPTIONS=--no-warnings vue-cli-service build",
            "//2b": "",
            "compile:build:server:config": "cross-env NODE_ENV=production TS_CONFIG_PATH=src/server/tsconfig.json ENVIRONMENT=server gulp",
            "compile:build:client:config": "cross-env NODE_ENV=production TS_CONFIG_PATH=src/client/tsconfig.json ENVIRONMENT=client gulp",
            "//3": "",
            "build:app": "npm run build:web && cap copy && cap sync && cap open",
            "build:app:android": "npm run build:web && cap copy && cap sync && cap open android",
            "build:app:ios": "npm run build:web && cap copy && cap sync && cap open ios",
            "//4": "",
            "test": "npm run test:unit && npm run test:e2e",
            "test:unit": "npm run test:unit:server && npm run test:unit:client",
            "test:unit:server": "echo 'no test:unit:server script",
            "test:unit:client": "npm run compile:test:unit:client:config && cross-env NODE_ENV=test nyc vue-cli-service test:unit ./tests/unit/client/index.spec.ts",
            "test:e2e": "cross-env NODE_OPTIONS=--no-warnings vue-cli-service test:e2e",
            "//4b": "",
            "compile:test:unit:server:config": "cross-env NODE_ENV=test TS_CONFIG_PATH=tests/unit/server/tsconfig.json ENVIRONMENT=server gulp",
            "compile:test:unit:client:config": "cross-env NODE_ENV=test TS_CONFIG_PATH=tests/unit/client/tsconfig.json ENVIRONMENT=client gulp",
            "//5": "",
            "lint": "npm-run-all -p lint:*",
            "lint:script": "vue-cli-service lint",
            "lint:style": "stylelint **/*.scss",
            "//6": "",
            "type-coverage": "typescript-coverage-report -o ./coverage/type-report",
            "prepare": "cd dev/eslint-plugin-boilerplate && npm run build && cd ../.. && is-ci || husky install"
        },
        devDependencies: ownPackageJSON.devDependencies,
        dependencies: {
            "vue": "^3.2.45",
            "vue-router": "^4.1.6",
            "reflect-metadata": "^0.1.13",
            "sql.js": "^1.8.0",
            "localforage": "^1.10.0",
            "@babel/runtime": "^7.20.1",
            "@capacitor/android": "4.0.1",
            "@capacitor/app": "4.0.1",
            "@capacitor/core": "4.0.1",
            "@capacitor/haptics": "4.0.1",
            "@capacitor/ios": "4.0.1",
            "@capacitor/keyboard": "4.0.1",
            "@capacitor/status-bar": "4.0.1",
            "@ionic/pwa-elements": "^3.1.1",
            "@ionic/vue": "^6.3.6",
            "@ionic/vue-router": "^6.3.6"
        }
    });

    writeJSONSync("./package.json", projectPackageJSON, { encoding: "utf-8", spaces: 4, EOL: "\n" });
    childProcess.execSync("npm install", { encoding: "utf-8", stdio: "inherit" });

}

module.exports = { init };
