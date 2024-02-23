#! /usr/bin/env node
import { doDataModelAction, doInit } from "../index.js";
import { run, handleError, printSuccessMessage } from "dx-cli-tools";
import { doDatabaseSync } from "../index.js";

const cliToolName = "divblox";

const init = {
    name: "init",
    description:
        "Generates the required folder structure to support Divblox in your project." +
        " Also installs all the required Divblox development dependencies.",
    allowedOptions: ["overwrite"],
    f: async (...args) => {
        args.forEach((arg) => {
            if (!init.allowedOptions.includes(arg)) {
                handleError(`Invalid option passed to init flag: ${arg}`);
            }
        });

        let overwrite = false;
        if (args.includes("overwrite")) {
            overwrite = true;
        }

        await doInit(overwrite);
    },
};

const sync = {
    name: "sync",
    description: "Synchronizes your underlying database with the provided data model",
    allowedOptions: ["accept-all", "skip-pull"],
    f: async (...args) => {
        args.forEach((arg) => {
            if (!sync.allowedOptions.includes(arg)) {
                handleError(`Invalid option passed to sync flag: ${arg}`);
            }
        });

        let skipUserPrompts = false;
        if (args.includes("accept-all")) {
            skipUserPrompts = true;
        }

        let skipPullDataModel = false;
        if (args.includes("skip-pull")) {
            skipPullDataModel = true;
        }

        await doDatabaseSync(skipUserPrompts, skipPullDataModel);
    },
};

const generate = {
    name: "generate",
    f: async () => {
        console.log("Not supported yet...");
    },
    description: "Configures your project's ORM based on the provided data model and ORM implementation",
};

const crud = {
    name: "crud",
    f: async () => {
        console.log("Not supported yet...");
    },
    description: "Generates a CRUD component for the provided entity based on your selected web framework",
};

const dataModel = {
    name: "datamodel",
    description: "Allows interaction with a web divblox.app data model.",
    allowedOptions: ["push", "pull"],
    f: async (...args) => {
        if (!dataModel.allowedOptions.includes(args[0])) {
            handleError(`Invalid option passed to datamodel flag: ${args[0] ?? "No option passed"}`);
        }

        let uniqueIdentifier = args.filter((value, index) => 0 !== index).join(" ");

        if (!uniqueIdentifier) {
            uniqueIdentifier = "core";
        }

        await doDataModelAction(args[0], uniqueIdentifier);
    },
};

const supportedArguments = {
    "-i": init,
    "--init": init,
    "-s": sync,
    "--sync": sync,
    "-g": generate,
    "--generate": generate,
    "-c": crud,
    "--crud": crud,
    "-dm": dataModel,
    "--datamodel": dataModel,
};

await run({
    supportedArguments: supportedArguments,
    cliToolName: cliToolName,
});
