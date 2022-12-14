#! /usr/bin/env node

const { hideBin } = require("yargs/helpers");
const yargs = require("yargs/yargs");
const { init } = require("./init");

const noop = () => {
    // Nothing to do here
};

yargs(hideBin(process.argv)).command("init", "Initializes a new App", noop, async () => {
    await init();
}).command("upgrade", "Upgrades the project structure to the new version", noop, () => {
    console.log("did it again");
}).parse();
