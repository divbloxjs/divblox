import { fileURLToPath, pathToFileURL } from "url";
import path from "path";

import * as fs from "fs";
import * as fsAsync from "fs/promises";

import * as cliHelpers from "dx-cli-tools/helpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.resolve(path.dirname(__filename), "..");
const templateDir = path.join(__dirname, "templates");

let overwriteFiles = false;
let uiImplementation = "tailwindcss"; // or shadcn;
let componentsPathAlias = "$lib/dx-components";
let componentsPathFromRoot = "/src/lib/dx-components";

const divbloxRoot = "divblox";

const foldersToCreate = {
    Divblox: divbloxRoot,
    "Divblox Templates": `${divbloxRoot}/templates`,
    "Divblox Configs": `${divbloxRoot}/configs`,
    Server: `src/lib/server`,
};

const filesToCreate = {
    "Divblox Config": {
        location: `dx.config.js`,
        template: `${templateDir}/configs/dx.config.js`,
        tokens: ["uiImplementation", "componentsPathFromRoot", "componentsPathAlias"],
    },
    "Divblox Database Config": {
        location: `${divbloxRoot}/configs/database.config.js`,
        template: `${templateDir}/configs/database.config.js`,
        tokens: [],
    },
    "Divblox Data Model": {
        location: `${divbloxRoot}/configs/datamodel.json`,
        template: `${templateDir}/configs/datamodel.json`,
        tokens: [],
    },
    "Divblox Config Readme": {
        location: `${divbloxRoot}/configs/README.md`,
        template: `${templateDir}/configs/README.md`,
        tokens: [],
    },
    "Docker Compose": {
        location: `${divbloxRoot}/docker-compose.yml`,
        template: `${templateDir}/docker-compose.yml`,
        tokens: [],
    },
    "Prisma helpers": {
        location: `src/lib/server/prisma.helpers.js`,
        template: `${templateDir}/prisma.helpers.js`,
        tokens: [],
    },
    "Prisma instance": {
        location: `src/lib/server/prisma-instance.js`,
        template: `${templateDir}/prisma-instance.js`,
        tokens: [],
    },
};

/**
 * Creates the minimum folder structure needed for Divblox
 * @returns {Promise<void>}
 */
async function createFolderStructure() {
    cliHelpers.printSubHeadingMessage(`Generating Divblox folder structure...`);
    for (const folderPath of Object.values(foldersToCreate)) {
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath);
            cliHelpers.printInfoMessage(`Created directory: ${folderPath}`);
        }
    }

    for (const { location, template, tokens } of Object.values(filesToCreate)) {
        if (!overwriteFiles && fs.existsSync(location)) {
            cliHelpers.printInfoMessage(`Skipped file: ${location}`);
            continue;
        }

        let fileContentStr = await fsAsync.readFile(template);
        fileContentStr = fileContentStr.toString();

        if (uiImplementation === "shadcn") {
            componentsPathFromRoot = "/src/lib/components/shadcn";
            componentsPathAlias = "$lib/components/shadcn";
        }

        const tokensToReplace = {
            uiImplementation,
            componentsPathFromRoot,
            componentsPathAlias,
        };
        for (const tokenName of tokens) {
            if (Object.keys(tokensToReplace).includes(tokenName)) {
                const search = `[${tokenName}]`;
                fileContentStr = fileContentStr.replaceAll(search, tokensToReplace[tokenName]);
            }
        }

        await fsAsync.writeFile(location, fileContentStr);
        cliHelpers.printInfoMessage(`Created file: ${location}`);
    }

    cliHelpers.printSuccessMessage("Divblox initialization done!");
}

export const initOrm = async (ormImplementation = "none") => {
    cliHelpers.printHeadingMessage("Initializing Divblox ORM implementation...");

    const packageJSONPath = pathToFileURL(`${process.cwd()}/package.json`);

    let fileContentStr = await fsAsync.readFile(packageJSONPath);
    fileContentStr = fileContentStr.toString();
    let installedDevDependencies;
    try {
        const packageJSON = JSON.parse(fileContentStr);
        installedDevDependencies = packageJSON.devDependencies ?? {};
        if (!installedDevDependencies["divblox"])
            cliHelpers.printInfoMessage(
                "Divblox CLI running in global mode... Consider installing it as a local dev dependency",
            );
    } catch (err) {
        cliHelpers.printErrorMessage("Aborted");
        cliHelpers.printSubHeadingMessage(
            "Your local project is not setup correctly. Please ensure a valid package.json file.",
        );
        process.exit(1);
    }

    switch (ormImplementation) {
        case "prisma":
            cliHelpers.printSubHeadingMessage("Configuring prisma as divblox ORM implemenation...");
            if (!installedDevDependencies["prisma"]) {
                cliHelpers.printInfoMessage("Installing prisma cli...");
                const installResult = await cliHelpers.executeCommand("npm install prisma --save-dev");
                console.log(installResult.output.toString());

                cliHelpers.printInfoMessage("Initializing prisma...");
                const initResult = await cliHelpers.executeCommand("npx prisma init --datasource-provider mysql");

                if (initResult.output.toString().length > 0) {
                    console.log(initResult.output.toString());
                    console.log("The steps above will be automatically run by the divblox cli when running divblox -s");
                } else {
                    cliHelpers.printWarningMessage(initResult.error.toString());
                    console.log("Prisma might already be configured. Check if the prisma folder exists.");
                }

                cliHelpers.printInfoMessage("Installing prisma client...");
                const clientResult = await cliHelpers.executeCommand("npm install @prisma/client");
                console.log(clientResult.output.toString());

                cliHelpers.printSuccessMessage(
                    `ORM implementation for ${ormImplementation} has been configured.\nYou can now run 'npx divblox -s' to sync your data model with your database and use ${ormImplementation} to run queries`,
                );
            } else {
                cliHelpers.printInfoMessage(
                    "Prisma already installed.\nIf you're having trouble, try deleting your prisma folder and running 'npm remove prisma' and then run 'npx divblox -i' again",
                );
            }
            break;
        case "none":
        default:
            cliHelpers.printInfoMessage("No ORM Implementation defined. Skipped.");
    }
};

/**
 * Handles the command line input that is used to prepare the npm package for the new project
 * @return {Promise<void>}
 */
export async function initDivblox(doOverwrite = false) {
    overwriteFiles = doOverwrite;
    const response = await cliHelpers.getCommandLineInput(
        `This will generate the necessary folder structure for Divblox. Continue? [Y/n] `,
    );

    const confirmed = response === "" || response.toLowerCase() === "y";

    if (!confirmed) {
        cliHelpers.printErrorMessage("Aborted");
        cliHelpers.printSubHeadingMessage("Run 'divblox -h' for supported usage.");
        process.exit(1);
    }

    uiImplementation = await cliHelpers.getCommandLineInput(
        `Which UI implementation would you like to use for code generation? (Shadcn recommended) [shadcn|tailwindcss|none] `,
    );

    if (
        uiImplementation.toLowerCase() !== "shadcn" &&
        uiImplementation.toLowerCase() !== "tailwindcss" &&
        uiImplementation.toLowerCase() !== "none"
    ) {
        cliHelpers.printErrorMessage("Aborted");
        cliHelpers.printSubHeadingMessage(
            "Invalid UI implementation provided. Supported options: [shadcn|tailwindcss|none]",
        );
        process.exit(1);
    }

    const install1Result = await cliHelpers.executeCommand("npm install dx-utilities");
    console.log(install1Result.output.toString());

    const install2Result = await cliHelpers.executeCommand("npm install qs");
    console.log(install2Result.output.toString());

    process.stdin.destroy();

    await createFolderStructure();

    cliHelpers.printHeadingMessage("Please update your svelte.config.js");
    cliHelpers.printInfoMessage("It should include the alias 'datamodel' and 'divblox'");
    cliHelpers.printWarningMessage("kit: {");
    cliHelpers.printWarningMessage("\talias: {");
    cliHelpers.printWarningMessage(`\t\tdivblox: "divblox",`);
    cliHelpers.printWarningMessage(`\t\tdatamodel: "divblox/configs/datamodel.json",`);
    cliHelpers.printWarningMessage("\t}");
    cliHelpers.printWarningMessage("},");

    cliHelpers.printHeadingMessage("Please update your vite.config.js");
    cliHelpers.printInfoMessage("It should include the alias 'datamodel' and 'divblox'");
    cliHelpers.printWarningMessage("server: {");
    cliHelpers.printWarningMessage("\tfs: {");
    cliHelpers.printWarningMessage(`\t\tallow: ["dx.config.js"]`);
    cliHelpers.printWarningMessage("\t}");
    cliHelpers.printWarningMessage("},");
}
