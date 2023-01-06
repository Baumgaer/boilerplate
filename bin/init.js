/* eslint-disable @typescript-eslint/unbound-method */
const childProcess = require("child_process");
const path = require("path");
const arp = require("app-root-path");
const deepDash = require("deepdash");
const { writeFile, copy, readJSONSync, writeJSONSync, existsSync } = require("fs-extra");
const lodash = require("lodash");
const { get } = require("lodash");
const mkdirp = require("mkdirp");

deepDash(lodash);

const gitKeep = "";

const gitIgnore = `# Specifies intentionally untracked files to ignore when using Git
# http://git-scm.com/docs/gitignore

*~
*.sw[mnpcod]
.tmp
*.tmp
*.tmp.*
*.sublime-project
*.sublime-workspace
.DS_Store
Thumbs.db
UserInterfaceState.xcuserstate
$RECYCLE.BIN/

*.log
log.txt
npm-debug.log*

/.idea
/.ionic
/.sass-cache
/.sourcemaps
/.versions
/.vscode/launch.json
/.nyc_output
!/.vscode/settings.json
!/.vscode/extensions.json
/coverage
/coverage-ts
/src/*/configs/development/*.yml
/dist
/node_modules
/platforms
/plugins
/www`;

const fill = { gitKeep, gitIgnore };

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
                "Datatypes.d.ts": "copy",
                "Globals.d.ts": "copy"
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
            ".eslintrc": "copy",
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
            ".eslintrc": "copy",
            "tsconfig.json": "copy"
        }
    },
    tests: {
        e2e: {
            plugins: "copy",
            specs: { ".gitkeep": "fill gitKeep" },
            support: "copy",
            ".eslintrc": "copy"
        },
        unit: {
            client: {
                tests: { ".gitkeep": "fill gitKeep" },
                "index.spec.ts": "copy",
                "tsconfig.json": "copy"
            },
            common: {
                tests: { ".gitkeep": "fill gitKeep" },
                "index.spec.ts": "copy",
                "tsconfig.json": "copy"
            },
            server: {
                tests: { ".gitkeep": "fill gitKeep" },
                "index.spec.ts": "copy",
                "tsconfig.json": "copy"
            }
        }
    },
    ".browserslistrc": "copy",
    ".commitlintrc": "copy",
    ".editorconfig": "copy",
    ".eslintrc": "copy",
    ".gitignore": "fill gitIgnore",
    ".lintstagedrc": "copy",
    ".mocharc.js": "copy",
    ".nycrc": "copy",
    ".prettierrc": "copy",
    ".stylelintrc": "copy",
    "babel.config.js": "copy",
    "capacitor.config.ts": "copy",
    "cypress.config.ts": "copy",
    "gulpfile.js": "copy",
    "ionic.config.json": "copy",
    "tsconfig.json": "copy",
    "typedoc.json": "copy",
    "vue.config.js": "copy",
    "webpack.config.server.js": "copy"
};

const dependencies = [
    "@babel/runtime",
    "@capacitor/android",
    "@capacitor/app",
    "@capacitor/core",
    "@capacitor/haptics",
    "@capacitor/ios",
    "@capacitor/keyboard",
    "@capacitor/status-bar",
    "@ionic/pwa-elements",
    "@ionic/vue",
    "@ionic/vue-router",
    "app-root-path",
    "localforage",
    "lodash",
    "reflect-metadata",
    "sql.js",
    "tslib",
    "vue",
    "vue-router"
];

async function init() {

    // Build file structure
    const promises = [];
    lodash.eachDeep(files, (value, key, parentValue, context) => {
        promises.push(new Promise((resolve) => {
            const dirPath = path.join(...context.path.slice(0, -1));
            const filePath = path.join(dirPath, key);

            mkdirp(dirPath).then(() => {
                const commands = value.split(",");
                for (const command of commands) {
                    const [cmd, arg1] = command.trim().split(" ");

                    if (cmd === "fill") {
                        writeFile(filePath, get(fill, arg1), { encoding: "utf-8", flag: "w" }).then(resolve);
                    } else if (cmd === "copy") {
                        let srcPath = path.join(arp.path, "node_modules", "boilerplate", "bin", "templates", filePath);
                        if (!existsSync(srcPath)) srcPath = path.join(arp.path, "node_modules", "boilerplate", filePath);
                        copy(srcPath, filePath).then(resolve);
                    }
                }
            });

        }));
    }, { pathFormat: "array", leavesOnly: true });

    await Promise.all(promises);

    const ownPackageJSON = readJSONSync(path.join(arp.path, "node_modules", "boilerplate", "package.json"), { encoding: "utf-8" });
    const projectPackageJSON = readJSONSync(path.join(arp.path, "package.json"), { encoding: "utf-8" });

    ownPackageJSON.devDependencies["eslint-plugin-boilerplate"] = "file:./node_modules/boilerplate/dev/eslint-plugin-boilerplate";
    ownPackageJSON.devDependencies["typescript-transformer-boilerplate"] = "file:./node_modules/boilerplate/dev/typescript-transformer-boilerplate";

    lodash.merge(projectPackageJSON, {
        engineStrict: true,
        engines: {
            "npm": "~8.18.0",
            "node": ">= 16.16.0"
        },
        scripts: ownPackageJSON.scripts,
        devDependencies: ownPackageJSON.devDependencies,
        dependencies: Object.fromEntries(Object.keys(ownPackageJSON.dependencies).filter((key) => {
            return dependencies.includes(key);
        }).map((key) => {
            return [key, ownPackageJSON.dependencies[key]];
        }))
    });

    writeJSONSync(path.join(arp.path, "package.json"), projectPackageJSON, { encoding: "utf-8", spaces: 4, EOL: "\n" });

    const devPath = path.join(arp.path, "node_modules", "boilerplate", "dev");
    const buildCmd = "npm install && npm run build";
    const options = { encoding: "utf-8", stdio: "inherit" };
    childProcess.execSync("npm install", options);
    childProcess.execSync(`cd ${path.join(devPath, "eslint-plugin-boilerplate")} && ${buildCmd}`, options);
    childProcess.execSync(`cd ${path.join(devPath, "typescript-transformer-boilerplate")} && ${buildCmd}`, options);

}

module.exports = { init };
