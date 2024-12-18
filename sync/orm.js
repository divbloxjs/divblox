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
    const introspectionResult = await cliHelpers.executeCommand("npx prisma db pull");

    cliHelpers.printSubHeadingMessage("Prisma introspection result:");
    console.log(introspectionResult.output.toString());

    cliHelpers.printSubHeadingMessage("Prisma generate result:");
    const generateResult = await cliHelpers.executeCommand("npx prisma generate");
    console.log(generateResult.output.toString());
};
