let cliToolName;
let versionNumber;

export const parseInputArguments = () => {
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

export const processParsedArguments = (parsedArgs = {}) => {
    let processedArgs = parsedArgs;
    delete processedArgs.unknowns;
    Object.keys(processedArgs).forEach((argName) => {
        if (!Object.keys(supportedArguments).includes(argName)) {
            handleError(`Invalid argument: ${argName}`);
        }
    });

    return processedArgs;
};

export const outputSupportedUsage = async () => {
    const usage = {};
    Object.keys(supportedArguments).map((argumentName) => {
        const argName = supportedArguments[argumentName].name;
        if (!usage.hasOwnProperty(argName)) {
            usage[argName] = {
                Flags: [argumentName],
                Options: supportedArguments[argumentName].allowedOptions ?? [],
                Description: supportedArguments[argumentName].description,
            };
        } else {
            usage[argName].Flags.push(argumentName);
        }
    });

    console.log(`${cliToolName} CLI usage below: `);
    console.table(usage);
};

export const handleError = (message = "No message provided") => {
    console.log(`ERROR: Something went wrong. Run '${cliToolName} -h' for supported usage`);
    throw new Error(message);
};

const help = {
    name: "help",
    description: "Prints the currently supported usage of the CLI",
    f: async () => {
        await outputSupportedUsage();
    },
};

const version = {
    name: "version",
    description: `Prints the currently installed version of the ${cliToolName} CLI`,
    f: async () => {
        console.log(`${cliToolName} CLI version: ${versionNumber}`);
    },
};

const supportedArguments = {
    "-h": help,
    "--help": help,
    "-v": version,
    "--version": version,
};

export const run = async (passedSupportedArguments = {}, passedCliName = "divblox", passedVersionNumber = "0.0.0") => {
    cliToolName = passedCliName;
    versionNumber = passedVersionNumber;

    Object.keys(passedSupportedArguments).forEach((argName) => {
        supportedArguments[argName] = passedSupportedArguments[argName];
    });

    const parsedArgs = parseInputArguments();
    const processedArgs = processParsedArguments(parsedArgs);

    if (Object.keys(processedArgs).length === 0) {
        console.log("No input flags provided. Run 'divblox -h' for supported usage.");
        process.exit(1);
    }

    for (const argName of Object.keys(processedArgs)) {
        await supportedArguments[argName].f.call(this, ...processedArgs[argName]);
    }
};
