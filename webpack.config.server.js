/* eslint-disable */
const arp = require('app-root-path');
const path = require('path');
const lodash = require("lodash");

const nodeExternals = require('webpack-node-externals');

const webpackConfigBase = require("./webpack.config.base");

module.exports = (env, options, returnConfigObject) => {

    ///////////////////////////////////
    // CONFIGURE ENVIRONMENT

    const inherited = Object.assign({}, options);
    Object.assign(options, {
        cacheDir: "./.build/cache/backend",
        scriptDir: "./src/server",
        tsConfigPath: "./src/server/tsconfig.json"
    }, inherited);

    ///////////////////////////////////
    // LOAD BASE

    const webpackConfigObject = webpackConfigBase(env, options, true);

    ///////////////////////////////////
    // CONFIGURE BUILD

    const alias = {
        "~server": [path.resolve(arp.path, "src", "server")],
        "~env": [path.resolve(arp.path, "src", "server")],
        "~common": [path.resolve(arp.path, "src", "common")]
    };

    if (options.mode === "test") {
        const serverPath = path.resolve(arp.path, "tests", "unit", "server");
        alias.client.unshift(serverPath);
        alias["~env"].unshift(serverPath);
        alias["~server"].unshift(serverPath);
        alias["~common"].unshift(path.resolve(arp.path, "tests", "unit", "common"));
    }

    const settings = lodash.merge(webpackConfigObject.settings, {
        target: "node",
        entry: {
            server: path.resolve(arp.path, "src", "server", "main.ts")
        },
        output: {
            path: path.resolve(arp.path, "dist", "server")
        },
        cache: {
            name: "server"
        },
        resolve: { alias },
        node: {
            // Need this when working with express, otherwise the build fails
            __dirname: false,   // if you don't put this is, __dirname
            __filename: false,  // and __filename return blank or /
        },
        externals: [nodeExternals()], // Need this to avoid error when working with Express
        optimization: {
            splitChunks: false
        }
    });

    ///////////////////////////////////
    // EXTEND BUILD PLUGINS
    // settings.plugins = settings.plugins.concat([]);

    ///////////////////////////////////
    // EXTENDS BUILD MODULE RULES

    // settings.module.rules = settings.module.rules.concat([]);

    return returnConfigObject ? webpackConfigObject : settings;
};
