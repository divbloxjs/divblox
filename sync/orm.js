import * as cliHelpers from "dx-cli-tools/helpers.js";
import { readFileSync, writeFileSync, existsSync, appendFileSync } from "fs";

export const updateOrmConfiguration = async (configOptions) => {
    cliHelpers.printSubHeadingMessage("Updating ORM configuration...");
    switch (configOptions.dxConfig.ormImplementation) {
        case "prisma":
            cliHelpers.printSubHeadingMessage("ORM Implmentation: prisma. Updating prisma environment variables...");
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
    const { output: introspectionOutput, error: introspectionError } = await cliHelpers.executeCommand(
        "npx prisma db pull --force",
    );

    cliHelpers.printSubHeadingMessage(
        `Prisma 'npx prisma db pull --force': ${introspectionError ? "FAILED" : "Success"}`,
    );

    if (introspectionOutput) console.log(introspectionOutput.toString());
    if (introspectionError) console.error(introspectionError.toString());

    const { output: generateResult, error: generateError } = await cliHelpers.executeCommand("npx prisma generate");
    cliHelpers.printSubHeadingMessage(`Prisma 'npx prisma generate': ${generateError ? "FAILED" : "Success"}`);

    if (generateResult) console.log(generateResult.toString());
    if (generateError) console.error(generateError.toString());
};
