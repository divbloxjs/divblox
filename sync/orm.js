import * as cliHelpers from "dx-cli-tools/helpers.js";
import { readFileSync, writeFileSync, existsSync, appendFileSync } from "fs";

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
                if (!existsSync("./.env")) {
                    appendFileSync("./.env", `DATABASE_URL="${dataBaseStringToUpdate}"`);
                }

                const dotenvContents = readFileSync("./.env", { encoding: "utf-8" }).toString();
                if (dotenvContents.indexOf("DATABASE_URL") > -1) {
                    const updatedContents = dotenvContents.replace(process.env.DATABASE_URL, dataBaseStringToUpdate);
                    writeFileSync("./.env", updatedContents);
                } else {
                    appendFileSync("./.env", `\nDATABASE_URL="${dataBaseStringToUpdate}"`);
                }

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
    cliHelpers.printSuccessMessage("Post sync ORM actions completed");
};

const doPrismaIntrospection = async () => {
    cliHelpers.printSubHeadingMessage("Running prisma introspection and generate...");
    const introspectionResult = await cliHelpers.executeCommand("npx prisma db pull");

    cliHelpers.printSubHeadingMessage("Prisma introspection result:");
    console.log(introspectionResult.output.toString());

    cliHelpers.printSubHeadingMessage("Prisma generate result:");
    const generateResult = await cliHelpers.executeCommand("npx prisma generate");
    console.log(generateResult.output.toString());
};
