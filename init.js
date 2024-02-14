import { fileURLToPath } from "url";
import path from "path";

import * as fs from "fs";
import * as fsAsync from "fs/promises";

import * as cliHelpers from "dx-cli-tools/helpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templateDir = path.join(__dirname, "templates");

let overwriteFiles = false;

const divbloxRoot = "divblox";

const foldersToCreate = {
    Divblox: divbloxRoot,
    "Divblox Templates": `${divbloxRoot}/templates`,
    "Divblox Configs": `${divbloxRoot}/configs`,
    "Divblox Generated": `${divbloxRoot}/generated`,
};

const filesToCreate = {
    "Divblox Config": {
        location: `${divbloxRoot}/configs/dx.config.json`,
        template: `${templateDir}/configs/dx.config.json`,
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
};

/**
 * Creates the minimum folder structure needed for Divblox
 * @returns {Promise<void>}
 */
async function createFolderStructure() {
    cliHelpers.printSubHeadingMessage(`Generating Divblox folder structure...`);
    for (const folderInfo of Object.keys(foldersToCreate)) {
        if (!fs.existsSync(foldersToCreate[folderInfo])) {
            fs.mkdirSync(foldersToCreate[folderInfo]);
            cliHelpers.printInfoMessage(`Created directory: ${foldersToCreate[folderInfo]}`);
        }
    }

    for (const fileInfo of Object.keys(filesToCreate)) {
        if (!overwriteFiles && fs.existsSync(filesToCreate[fileInfo].location)) {
            cliHelpers.printInfoMessage(`Skipped file: ${filesToCreate[fileInfo].location}`);
            continue;
        }

        let fileContentStr = await fsAsync.readFile(filesToCreate[fileInfo].template);
        let dxConfigExampleStr = await fsAsync.readFile(`${templateDir}/configs/dx.config.json`);
        fileContentStr = fileContentStr.toString();
        dxConfigExampleStr = dxConfigExampleStr.toString();

        const tokensToReplace = {
            dxConfigExample: dxConfigExampleStr,
        };

        const availableTokensToReplace = filesToCreate[fileInfo].tokens;
        if (typeof availableTokensToReplace !== "undefined") {
            for (const token of availableTokensToReplace) {
                if (Object.keys(tokensToReplace).includes(token)) {
                    const search = `[${token}]`;
                    fileContentStr = fileContentStr.replaceAll(search, tokensToReplace[token]);
                }
            }
        }

        await fsAsync.writeFile(filesToCreate[fileInfo].location, fileContentStr);
        cliHelpers.printInfoMessage(`Created file: ${filesToCreate[fileInfo].location}`);
    }

    cliHelpers.printSuccessMessage("Divblox initialization done!");
}

/**
 * Handles the command line input that is used to prepare the npm package for the new project
 * @return {Promise<void>}
 */
export async function initDivblox(doOverwrite = false) {
    overwriteFiles = doOverwrite;
    const confirmed = await cliHelpers.getCommandLineInput(
        `This will generate the necessary folder structure for Divblox. Continue? [y/N] `,
    );

    if (confirmed.toLowerCase() !== "y") {
        cliHelpers.printErrorMessage("Aborted");
        cliHelpers.printSubHeadingMessage("Run 'divblox -h' for supported usage.");
        process.exit(1);
    }

    process.stdin.destroy();
    await createFolderStructure();
    await downloadDependencies();
}

/**
 * Downloads the necessary divblox dependencies
 * @return {Promise<boolean>}
 */
async function downloadDependencies() {
    return true;
    // TODO When dx-db-sync et. al. are complete - need to be installed
    cliHelpers.printInfoMessage("Installing divbloxjs...");
    const createResult = await cliHelpers.executeCommand("npm install divbloxjs");
    if (typeof createResult === "undefined" || createResult === null) {
        console.error("Could not install divbloxjs. Please restart the installer.");
        return false;
    }

    if (createResult.stderr.length > 0) {
        cliHelpers.printErrorMessage("divbloxjs install failed: " + createResult.stderr);
        return false;
    }

    if (createResult.stdout.length > 0) {
        cliHelpers.printSuccessMessage("divbloxjs install result: " + createResult.stdout);
        cliHelpers.printInfoMessage("You can now start divblox with: ");
        cliHelpers.printTerminalMessage("npm run dev");
        cliHelpers.printInfoMessage("Note: this requires docker to be installed");
        cliHelpers.printInfoMessage(
            "Alternatively, if you have your own database service configured, start your instance with",
        );
        cliHelpers.printTerminalMessage("npm start");
        cliHelpers.printInfoMessage("or: ");
        cliHelpers.printTerminalMessage("npm run start-silent");
        cliHelpers.printInfoMessage(
            "to ignore database checks " +
                "(Useful when running with a process manager like pm2 to ensure uninterrupted restarts).\n" +
                "To setup your environments, modify the file dxconfig.json located at divblox-config/dxconfig.json",
        );
    }

    return true;
}
