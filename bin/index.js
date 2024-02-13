#! /usr/bin/env node
import { defaultFunction, doSomething } from "../index.js";
import { readFileSync } from "node:fs";

// macOS, Linux, and Windows
const help = {
    name: "help",
    f: async () => {
        await outputSupportedUsage();
    },
    description: "Prints the currently supported usage of the CLI",
};

const version = {
    name: "version",
    f: async () => {
        const versionNumber = JSON.parse(readFileSync("./package.json", { encoding: "utf8", flag: "r" })).version;
        console.log("Divblox CLI version: ", versionNumber);
    },
    description: "Prints the currently installed version of the Divblox CLI",
};

const sync = {
    name: "sync",
    f: async () => {
        console.log("Not supported yet...");
    },
    description: "Synchronizes your underlying database with the provided data model",
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

const supportedArguments = {
    "-h": help,
    "--help": help,
    "-v": version,
    "--version": version,
    "-s": sync,
    "--sync": sync,
    "-g": generate,
    "--generate": generate,
    "-c": crud,
    "--crud": crud,
};

const parseInputArguments = () => {
    let parsedArgs = { unknowns: [] };
    if (!Array.isArray(process.argv)) {
        handleError("Invalid arguments");
    }

    let currentArgName = "unknowns";
    process.argv.forEach((arg, idx) => {
        if (arg.charAt(0) === "-") {
            currentArgName = arg;
            parsedArgs[arg] = [];
        } else {
            parsedArgs[currentArgName].push(arg);
        }
    });

    return parsedArgs;
};

const processParsedArguments = (parsedArgs) => {
    let processedArgs = parsedArgs;
    delete processedArgs.unknowns;
    Object.keys(processedArgs).forEach((argName) => {
        if (!Object.keys(supportedArguments).includes(argName)) {
            handleError(`Invalid argument: ${argName}`);
        }
    });

    return processedArgs;
};

const outputSupportedUsage = async () => {
    const usage = {};
    Object.keys(supportedArguments).map((argumentName) => {
        const argName = supportedArguments[argumentName].name;
        if (!usage.hasOwnProperty(argName)) {
            usage[argName] = { Flags: [argumentName], Description: supportedArguments[argumentName].description };
        } else {
            usage[argName].Flags.push(argName);
        }
    });

    console.log(`Divblox CLI usage below: `);
    console.table(usage);
};

const handleError = (message) => {
    console.log("ERROR: Something went wrong. Run divblox -h for support usage");
    throw new Error(message);
};

const parsedArgs = parseInputArguments();
const processedArgs = processParsedArguments(parsedArgs);

if (Object.keys(processedArgs).length === 0) {
    console.log("No input flags provided. Run 'divblox -h' for support usage.");
    process.exit(1);
}
for (const argName of Object.keys(processedArgs)) {
    await supportedArguments[argName].f.call();
}
