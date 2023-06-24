const os = require('os');
const path = require('path');
const arp = require('app-root-path');

const TerserPlugin = require('terser-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin').TsconfigPathsPlugin;
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = (_env, options, returnConfigObject) => {

    console.log("operating in mode", options.mode);

    ///////////////////////////////////
    // PROVIDE UTILS

    const isDevelopment = Boolean(options.mode === "development");

    const threadLoaderSettings = () => {
        return {
            loader: 'thread-loader',
            options: {
                // there should be 1 cpu for the fork-ts-checker-webpack-plugin
                workers: Math.max(Math.floor((os.cpus().length) / 2), 1),
                poolRespawn: false,
                poolTimeout: options.watch ? Infinity : 1000 // set this to Infinity in watch mode - see https://github.com/webpack-contrib/thread-loader
            }
        };
    };

    const TSCONFIG_PATH = path.resolve(arp.path, options.tsConfigPath);

    ///////////////////////////////////
    // CONFIGURE BUILD

    const settings = {
        output: {
            filename: "[name].js"
        },
        context: path.resolve(arp.path),
        devtool: 'source-map',
        cache: {
            type: 'filesystem',
            cacheDirectory: path.resolve(__dirname, '.build')
        },
        plugins: [
            new ForkTsCheckerWebpackPlugin({
                async: true,
                typescript: {
                    enabled: true,
                    configFile: TSCONFIG_PATH,
                    diagnosticOptions: {
                        syntactic: true
                    },
                    profile: true
                }
            })
        ],
        resolve: {
            extensions: [".ts", ".d.ts", ".tsx", ".html", ".scss", ".css", ".yml", ".yaml"],
            plugins: [
                new TsconfigPathsPlugin({
                    configFile: TSCONFIG_PATH,
                    extensions: [".ts", ".d.ts", ".tsx", ".html", ".scss", ".css"]
                })
            ]
        },
        module: {
            rules: [{
                test: /\.m?tsx?$/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            configFile: TSCONFIG_PATH,
                            context: path.dirname(TSCONFIG_PATH),
                            happyPackMode: false,
                            transpileOnly: true
                        }
                    }]
            }, {
                test: /\.ya?ml$/,
                use: [{
                    loader: "yaml-loader"
                }]
            }]
        },
        optimization: {
            noEmitOnErrors: true,
            removeAvailableModules: !isDevelopment,
            removeEmptyChunks: !isDevelopment,
            minimize: !isDevelopment,
            minimizer: [new TerserPlugin({
                extractComments: false,
                terserOptions: {
                    compress: true,
                    keep_classnames: true,
                    keep_fnames: true,
                    sourceMap: true,
                    output: {
                        ecma: 2020,
                        comments: false,
                        beautify: false,
                        quote_style: 3
                    }
                }
            })]
        }
    };

    ///////////////////////////////////
    // EXTEND BUILD PLUGINS

    ///////////////////////////////////
    // EXTEND OPTIMIZATION OPTIONS
    if (!isDevelopment) {
        settings.optimization.splitChunks = {
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: "vendor",
                    chunks: "all"
                }
            }
        };
    }

    ///////////////////////////////////
    // EXTEND WATCH OPTIONS
    if (options.watch) {
        settings.watchOptions = {
            ignored: [
                ".github",
                ".husky",
                ".nyc_output",
                ".vscode",
                "android",
                "bin",
                "coverage",
                "dev",
                "dist",
                "doc",
                "ios",
                "node_modules",
                "src/client"
            ]
        };
    }

    const webpackConfigObject = { settings, threadLoaderSettings };
    return returnConfigObject ? webpackConfigObject : settings;

};
