module.exports = {
    presets: [
        '@vue/cli-plugin-babel/preset'
    ],
    plugins: ["@babel/plugin-transform-class-static-block"],
    env: {
        test: {
            plugins: [
                "istanbul"
            ]
        }
    }
};
