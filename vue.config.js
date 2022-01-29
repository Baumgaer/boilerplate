const path = require('path');
const arp = require('app-root-path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin').TsconfigPathsPlugin;

const TSCONFIG_PATH = path.resolve(arp.path, "src", "client", "tsconfig.json");

module.exports = {
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

        if (config.resolve.plugins) {
            config.resolve.plugins.push(tsConfigPathsPlugin);
        } else config.resolve.plugins = [tsConfigPathsPlugin];

        // Aliasing for templates
        config.resolve.alias.client = path.resolve(arp.path, "src", "client");
        config.resolve.alias["~client"] = path.resolve(arp.path, "src", "client");
        config.resolve.alias["~common"] = path.resolve(arp.path, "src", "common");
        config.resolve.alias["~env"] = path.resolve(arp.path, "src", "client");
    },
    chainWebpack: (config) => {

        config.module.rule('ts').use('ts-loader').merge({
            options: {
                configFile: TSCONFIG_PATH,
                context: path.dirname(TSCONFIG_PATH),
                compiler: "ttypescript"
            }
        });

        config.plugin('fork-ts-checker').tap(args => {
            args[0].typescript.configFile = TSCONFIG_PATH;
            return args;
        });

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
