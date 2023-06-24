const path = require('path');
const arp = require('app-root-path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin').TsconfigPathsPlugin;
const webpack = require("webpack");

console.info("Building with environment", process.env.NODE_ENV);
let TSCONFIG_PATH = path.resolve(arp.path, "src", "client", "tsconfig.json");
if (process.env.NODE_ENV === "test") TSCONFIG_PATH = path.resolve(arp.path, "tests", "unit", "client", "tsconfig.json");

module.exports = {
    outputDir: path.resolve(arp.path, "dist", "client"),
    pages: {
        index: {
            entry: 'src/client/main.ts',
            template: 'public/index.html'
        }
    },
    configureWebpack: (config) => {
        config.devtool = 'source-map';

        const tsConfigPathsPlugin = new TsconfigPathsPlugin({
            configFile: TSCONFIG_PATH,
            extensions: [".ts", ".tsx", ".vue", ".scss", ".css"]
        });

        const normalModuleReplacementPlugin = new webpack.NormalModuleReplacementPlugin(/typeorm$/, function (result) {
            result.request = result.request.replace(/typeorm/, "typeorm/browser");
        });

        const providePluginConfig = {
            'window.SQL': 'sql.js/dist/sql-wasm.js',
            'window.localforage': 'localforage/dist/localforage.min.js'
        };
        if (process.env.NODE_ENV !== "test") providePluginConfig.process = 'process/browser';
        const providePlugin = new webpack.ProvidePlugin(providePluginConfig);

        if (!config.plugins) {
            config.plugins = [normalModuleReplacementPlugin, providePlugin];
        } else config.plugins.push(normalModuleReplacementPlugin, providePlugin);

        if (config.resolve.plugins) {
            config.resolve.plugins.push(tsConfigPathsPlugin);
        } else config.resolve.plugins = [tsConfigPathsPlugin];

        // For SqlJS
        config.resolve.fallback = { fs: false, path: false, crypto: false, a: false };
        config.experiments = { asyncWebAssembly: true, topLevelAwait: true };

        // Aliasing for templates
        config.resolve.alias.client = [path.resolve(arp.path, "src", "client")];
        config.resolve.alias["~client"] = [path.resolve(arp.path, "src", "client")];
        config.resolve.alias["~common"] = [path.resolve(arp.path, "src", "common")];
        config.resolve.alias["~env"] = [path.resolve(arp.path, "src", "client")];

        // fallbacks
        config.resolve.fallback.os = false;
        config.resolve.fallback.http = false;
        config.resolve.fallback.https = false;
        config.resolve.fallback.zlib = false;
        config.resolve.fallback.path = require.resolve("path-browserify");
        if (process.env.NODE_ENV !== "test") {
            config.resolve.fallback['process/browser'] = require.resolve('process/browser');
        }

        if (process.env.NODE_ENV === "test") {
            config.devtool = "inline-cheap-module-source-map";
            const clientPath = path.resolve(arp.path, "tests", "unit", "client");
            config.resolve.alias.client.unshift(clientPath);
            config.resolve.alias["~env"].unshift(clientPath);
            config.resolve.alias["~client"].unshift(clientPath);
            config.resolve.alias["~common"].unshift(path.resolve(arp.path, "tests", "unit", "common"));
        }
    },
    chainWebpack: (config) => {

        config.module.rule('ts').use('ts-loader').merge({
            options: {
                configFile: TSCONFIG_PATH,
                context: path.dirname(TSCONFIG_PATH)
            }
        });

        config.plugin('fork-ts-checker').tap(args => {
            args[0].typescript.configFile = TSCONFIG_PATH;
            return args;
        });
        config.module.rule('yml').test(/\.ya?ml$/).use('yaml-loader').loader('yaml-loader').end();

        config.optimization.minimizer('terser').tap(args => {
            const { terserOptions } = args[0];
            // eslint-disable-next-line
            terserOptions.keep_classnames = true;
            // eslint-disable-next-line
            terserOptions.keep_fnames = true;
            return args;
        });
    }
};
