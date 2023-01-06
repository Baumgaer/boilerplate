/* eslint-disable */
const arp = require('app-root-path');
const path = require('path');
const lodash = require("lodash");

const nodeExternals = require('webpack-node-externals');

const webpackConfigServer = require("./node_modules/boilerplate/webpack.config.server");

module.exports = (env, options, returnConfigObject) => {

    ///////////////////////////////////
    // CONFIGURE ENVIRONMENT

    const inherited = Object.assign({}, options);
    Object.assign(options, {
        cacheDir: path.resolve(arp.path, ".build", "cache", "backend"),
        scriptDir: path.resolve(arp.path, "src", "server"),
        tsConfigPath: path.resolve(arp.path, "src", "server", "tsconfig.json")
    }, inherited);

    ///////////////////////////////////
    // LOAD BASE

    const webpackConfigObject = webpackConfigServer(env, options, true);

    ///////////////////////////////////
    // CONFIGURE BUILD

    const settings = lodash.merge(webpackConfigObject.settings, {});

    ///////////////////////////////////
    // EXTEND BUILD PLUGINS

    ///////////////////////////////////
    // EXTENDS BUILD MODULE RULES

    return returnConfigObject ? webpackConfigObject : settings;
};
