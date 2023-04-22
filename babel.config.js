module.exports = {
    presets: [
        '@vue/cli-plugin-babel/preset'
    ],
    env: {
        test: {
            plugins: [
                "istanbul",
                ["@babel/plugin-transform-modules-commonjs", { allowTopLevelThis: true }],
                ["@babel/plugin-proposal-decorators", { version: "legacy" }],
                "@babel/plugin-proposal-class-properties",
                "@babel/plugin-proposal-nullish-coalescing-operator",
                "@babel/plugin-proposal-optional-chaining"
            ]
        }
    }
};
