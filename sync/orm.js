import * as cliHelpers from "dx-cli-tools/helpers.js";
import { readFileSync, writeFileSync } from "fs";

export const updateOrmConfiguration = async (configOptions) => {
    cliHelpers.printSubHeadingMessage("Updating ORM configuration...");
    switch (configOptions.dxConfig.ormImplementation) {
        case "prisma":
            cliHelpers.printSubHeadingMessage("ORM Implmentation: prisma. Updating prisma environment variables...");

            if (!Array.isArray(configOptions.databaseConfig.modules)) {
                cliHelpers.printErrorMessage(
                    "You have an error in your database configuration file. No valid modules are defined.",
                );
                cliHelpers.printInfoMessage("Skipped.");
                break;
            }

            if (configOptions.databaseConfig.modules.length > 1) {
                cliHelpers.printWarningMessage(
                    "ORM configuration currently only supports a single module for prisma ORM. Multiple modules are defined in your database config. Divblox will use the first configured module for your ORM configuration.",
                );
            }

            const databaseName = configOptions.databaseConfig.modules[0].schemaName;
            const dataBaseStringToUpdate = `mysql://${configOptions.databaseConfig.user}:${configOptions.databaseConfig.password}@${configOptions.databaseConfig.host}:${configOptions.databaseConfig.port}/${databaseName}`;

            try {
                const dotenvContents = readFileSync("./.env", { encoding: "utf-8" }).toString();
                const updatedContents = dotenvContents.replace(process.env.DATABASE_URL, dataBaseStringToUpdate);
                writeFileSync("./.env", updatedContents);
                process.env.DATABASE_URL = dataBaseStringToUpdate;
            } catch (err) {
                cliHelpers.printErrorMessage(
                    "There is an issue with your .env file. Please run npx divblox -i or fix manually.",
                );
                cliHelpers.printInfoMessage("Skipped.");
                break;
            }
            break;
        default:
            cliHelpers.printInfoMessage("No ORM Implementation defined. Skipped.");
    }
};

export const runOrmPostSyncActions = async (configOptions) => {
    cliHelpers.printHeadingMessage("Running post sync ORM actions...");
    switch (configOptions.dxConfig.ormImplementation) {
        case "prisma":
            await doPrismaIntrospection();
            break;
        default:
            cliHelpers.printInfoMessage("No ORM Implementation defined. Skipped.");
    }
};

const doPrismaIntrospection = async () => {
    cliHelpers.printSubHeadingMessage("Running prisma introspection and generate...");
    console.log("Prisma introspection result: ", await cliHelpers.executeCommand("npx prisma db pull"));
    console.log("Prisma generate result: ", await cliHelpers.executeCommand("npx prisma generate"));
};
