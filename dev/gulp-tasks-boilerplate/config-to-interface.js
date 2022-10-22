const { readdir, readFile, writeFile } = require("fs");
const path = require("path");
const arp = require("app-root-path");
const { watch } = require("gulp");
const jsonToTs = require("json-to-ts");
const { parse } = require("yaml");


function readConfigDir(environment) {
    return new Promise((resolve, reject) => {
        const configPath = path.join(arp.path, "src", environment, "configs", "default");
        readdir(configPath, { encoding: "utf-8", withFileTypes: true }, (error, files) => {
            if (error) return reject(error);
            resolve(files.filter((file) => file.isFile() && file.name.endsWith(".yml")).map((file) => path.join(configPath, file.name)));
        });
    });
}

function readConfigFile(path) {
    return new Promise((resolve, reject) => {
        readFile(path, { encoding: "utf-8" }, (error, data) => {
            if (error) return reject(error);
            resolve(data);
        });
    });
}

function readConfigFiles(files) {
    const allFilesDataPromises = [];
    for (const file of files) {
        allFilesDataPromises.push(new Promise((resolve) => resolve(file)));
        allFilesDataPromises.push(readConfigFile(file));
    }
    return Promise.all(allFilesDataPromises);
}

function writeConfigFile(environment, data) {
    return new Promise((resolve, reject) => {
        writeFile(path.join(arp.path, "src", environment, "@types", "Config.d.ts"), data, (error) => {
            if (error) return reject(error);
            resolve();
        });
    });
}

function buildConfig(environment, allFilesData) {
    const filesData = {};
    for (let index = 0; index < allFilesData.length; index = index + 2) {
        const name = path.basename(allFilesData[index]).split(".")[0];
        const data = allFilesData[index + 1];
        filesData[name] = parse(data);
    }

    let configContent = "/* eslint-disable @typescript-eslint/no-empty-interface */\nexport ";
    jsonToTs(filesData, { rootName: "IConfig" }).forEach((interface) => { configContent += String(interface.replaceAll("  ", "    ")) + "\n"; });

    return writeConfigFile(environment, configContent);
}

function createInterface(environment, callback) {
    console.info("creating configuration interface for", environment);
    const allFiles = [];
    readConfigDir("common").then((files) => {
        allFiles.push(...files);
        return readConfigFiles(files);
    }).then((allFilesData) => {
        return buildConfig("common", allFilesData);
    }).then(() => {
        return readConfigDir(environment);
    }).then((files) => {
        allFiles.push(...files);
    }).then(() => {
        return readConfigFiles(allFiles);
    }).then((allFilesData) => {
        return buildConfig(environment, allFilesData);
    }).then(callback);
}

exports.default = function (config, callback) {
    createInterface(config.environment, () => !config.watch ? callback() : console.info("watching config on environment:", config.environment));
    if (config.watch) {
        watch([
            path.join(arp.path, "src", "common", "configs/default/*.yml").replaceAll(path.sep, "/"),
            path.join(arp.path, "src", config.environment, "configs/default/*.yml").replaceAll(path.sep, "/")
        ], (callback) => createInterface(config.environment, callback));
    }
};
