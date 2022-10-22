const { series } = require("gulp");
const configToInterface = require("./dev/gulp-tasks-boilerplate/config-to-interface").default;

exports.default = series(
    (callback) => configToInterface({ watch: process.env.NODE_ENV === "development", environment: process.env.ENVIRONMENT }, callback)
);
