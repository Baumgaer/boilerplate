/* eslint-disable @typescript-eslint/unbound-method */
const { readdir, readFile, writeFile } = require("fs");
const path = require("path");
const arp = require("app-root-path");
const { watch } = require("gulp");
const jsonToTs = require("json-to-ts");
const { merge } = require("lodash");
const { parseConfigFileTextToJson, parseJsonConfigFileContent, sys } = require("typescript");
const { parse } = require("yaml");

const partialDefaultConfigPath = "configs/default";

function readTsConfigJson(configFilePath) {
    const configFile = sys.readFile(configFilePath);
    if (!configFile) throw new Error("No configuration found");

    const result = parseConfigFileTextToJson(configFilePath, configFile);
    const configObject = result.config;
    return parseJsonConfigFileContent(configObject, sys, path.dirname(configFilePath), {}, path.basename(configFilePath));
}

function readConfigDir(basePath) {
    return new Promise((resolve, reject) => {
        const configPath = path.join(basePath, "configs", "default");
        readdir(configPath, { encoding: "utf-8", withFileTypes: true }, (error, files) => {
            if (error) return reject(error);
            resolve(files.filter((file) => file.isFile() && file.name.endsWith(".yml")).map((file) => path.join(configPath, file.name)));
        });
    });
}

function readConfigDirs(basePaths, environment) {
    return new Promise((resolve, reject) => {
        const allPathLists = [];
        for (const basePath of basePaths) {
            allPathLists.push(readConfigDir(basePath));
        }

        Promise.all(allPathLists).then((allPathLists) => {
            const allPaths = [];
            for (const pathList of allPathLists) {
                for (const aPath of pathList) {
                    const splitter = path.join(`${path.sep}${environment}${path.sep}${partialDefaultConfigPath}${path.sep}`);
                    if (!aPath.includes(splitter)) continue;

                    const relativeConfigPath = aPath.split(splitter)[1];
                    if (allPaths.some((onePath) => onePath.split(splitter)[1] === relativeConfigPath)) continue;

                    allPaths.push(aPath);
                }
            }

            resolve(allPaths);
        }).catch((error) => reject(error));
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

function writeConfigFile(baseUrl, environment, data) {
    return new Promise((resolve, reject) => {
        writeFile(path.join(baseUrl, "..", environment, "@types", "Config.d.ts"), data, (error) => {
            if (error) return reject(error);
            resolve();
        });
    });
}

function buildConfig(baseUrl, environment, allFilesData) {
    const filesData = {};
    for (let index = 0; index < allFilesData.length; index = index + 2) {
        const name = path.basename(allFilesData[index]).split(".")[0];
        const data = allFilesData[index + 1];
        if (!(name in filesData)) {
            filesData[name] = parse(data);
        } else merge(filesData[name], parse(data));
    }

    let configContent = `/* eslint-disable @typescript-eslint/no-empty-interface */\n/*\n *   / \\     THIS FILE IS AUTO GENERATED!\n *  / | \\    DO NOT ADD CONTENT HERE!\n * /__.__\\   THIS WILL BE OVERWRITTEN DURING NEXT GENERATION!\n */\nexport `;
    jsonToTs(filesData, { rootName: "IConfig" }).forEach((interface) => { configContent += String(interface.replaceAll("  ", "    ")) + "\n"; });

    return writeConfigFile(baseUrl, environment, configContent);
}

function createInterface(baseUrl, basePaths, environment, callback) {
    console.info("creating configuration interface for", environment);
    const allFiles = [];
    readConfigDirs(basePaths, "common").then((files) => {
        allFiles.push(...files);
        return readConfigFiles(files);
    }).then((allFilesData) => {
        return buildConfig(baseUrl, "common", allFilesData);
    }).then(() => {
        return readConfigDirs(basePaths, environment);
    }).then((files) => {
        allFiles.push(...files);
    }).then(() => {
        return readConfigFiles(allFiles);
    }).then((allFilesData) => {
        return buildConfig(baseUrl, environment, allFilesData);
    }).then(callback);
}

exports.default = function (config, callback) {
    const tsConfigJson = readTsConfigJson(path.join(arp.path, config.tsConfigPath));

    const basePaths = [];
    const relevantEnvironments = ["~common/*", `~${config.environment}/*`];
    for (const relevantEnvironment of relevantEnvironments) {
        for (const mappedPath of tsConfigJson.options.paths[relevantEnvironment]) {
            basePaths.push(path.join(tsConfigJson.options.baseUrl, mappedPath.replace("*", "")));
        }
    }

    createInterface(tsConfigJson.options.baseUrl, basePaths, config.environment, () => !config.watch ? callback() : console.info("watching config on environment:", config.environment));
    if (config.watch) {
        watch(basePaths.map((basePath) => path.join(basePath, partialDefaultConfigPath, "/*.yml").replaceAll(path.sep, "/")), (callback) => createInterface(tsConfigJson.options.baseUrl, basePaths, config.environment, callback));
    }
};
