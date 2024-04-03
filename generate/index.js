import { DEFAULT_DATA_MODEL_UI_CONFIG_PATH } from "../constants.js";
import { getConfig } from "../index.js";
import * as cliHelpers from "dx-cli-tools/helpers.js";
import { syncDataModelUiConfig } from "../data-model/index.js";
import path from "path";

import { cpSync, readdirSync, statSync, readFileSync, writeFileSync, renameSync, existsSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { convertCamelCaseToPascalCase } from "dx-utilities";

export const generateCrudForEntity = async (entityName) => {
    const configOptions = await getConfig();

    if (!Object.keys(configOptions.dataModel).includes(entityName)) {
        cliHelpers.printErrorMessage(`${entityName} is not defined in the data model`);
        process.exit();
    }

    await syncDataModelUiConfig(configOptions);
    await createTemplateFoldersAndFiles(configOptions, entityName);

    cliHelpers.printSuccessMessage("syncDataModelUiConfig done!");
};

const createTemplateFoldersAndFiles = async (configOptions, entityName) => {
    if (configOptions.dxConfig.webFramework.toLowerCase() !== "sveltekit") {
        cliHelpers.printErrorMessage(
            `Unsupported web framework provided: ${configOptions.dxConfig.webFramework}. Allowed options: ['sveltekit']`,
        );
        process.exit(1);
    }

    const tokenValues = {
        __entityName__: entityName,
        __entityNamePascalCase__: convertCamelCaseToPascalCase(entityName),
    };

    console.log("tokenValues", tokenValues);

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.resolve(path.dirname(__filename), "..");
    const initialTemplateDir = path.join(__dirname, "/generate/templates/sveltekit");
    const tempTemplateDir = path.join(__dirname, "/generate/temp-generated");

    // Add templates to divblox root folder if not there
    const divbloxTemplateDir = `divblox/templates`;
    try {
        cpSync(initialTemplateDir, divbloxTemplateDir, { recursive: true, errorOnExist: false, force: false });
    } catch (err) {
        console.log("err", err);
    }
    // Copy over all templates into temp folder for processing
    cpSync(`${divbloxTemplateDir}/entity`, `${tempTemplateDir}/${entityName}`, { recursive: true });
    cpSync(`${divbloxTemplateDir}/form-elements`, `${tempTemplateDir}/form-elements`, { recursive: true });
    cpSync(`${divbloxTemplateDir}/route`, `${tempTemplateDir}/route`, { recursive: true });

    // Loop over every file in the temp folder and replace simple tokens in file name
    const filePaths = recursivelyGetFilePaths(tempTemplateDir);
    const newFilePaths = [];
    filePaths.forEach((filePath, index) => {
        let newFilePath = filePath;
        Object.keys(tokenValues).forEach((tokenName) => {
            newFilePath = newFilePath.replaceAll(tokenName, tokenValues[tokenName]);
        });

        renameSync(filePath, newFilePath);
        newFilePaths[index] = newFilePath;
    });

    // Loop over every file in the temp folder and replace simple tokens in file content
    newFilePaths.forEach((filePath) => replaceTokensInFile(filePath, tokenValues));

    const codeGenComponentsDir = configOptions?.dxConfig?.codeGen?.componentsPath;
    const codeGenRoutesDir = configOptions?.dxConfig?.codeGen?.routesPath;

    cpSync(`${tempTemplateDir}/${entityName}`, `${process.cwd()}/${codeGenComponentsDir}/${entityName}`, {
        recursive: true,
        errorOnExist: false,
        force: false,
    });

    cpSync(`${tempTemplateDir}/form-elements`, `${process.cwd()}/${codeGenComponentsDir}/form-elements`, {
        recursive: true,
        errorOnExist: false,
        force: false,
    });

    cpSync(`${tempTemplateDir}/route`, `${process.cwd()}/${codeGenRoutesDir}/${entityName}`, {
        recursive: true,
        errorOnExist: false,
        force: false,
    });
};

const recursivelyGetFilePaths = (directoryPath) => {
    try {
        let results = [];
        const list = readdirSync(directoryPath);
        list.forEach((file) => {
            file = path.join(directoryPath, file);
            const stat = statSync(file);
            if (stat && stat.isDirectory()) {
                // Recurse into subdir
                results = [...results, ...recursivelyGetFilePaths(file)];
            } else {
                // Is a file
                results.push(file);
            }
        });
        return results;
    } catch (error) {
        console.error(`Error when walking dir ${directoryPath}`, error);
    }
};

const replaceTokensInFile = (filePath, tokenValues = {}) => {
    if (existsSync(filePath)) cliHelpers.printInfoMessage(`Skipped existing file: ${filePath}`);
    const oldContent = readFileSync(filePath, { encoding: "utf8" });
    let newContent = oldContent;

    Object.keys(tokenValues).forEach((tokenName) => {
        newContent = newContent.replaceAll(tokenName, tokenValues[tokenName]);
    });

    writeFileSync(filePath, newContent, { encoding: "utf-8" });
};
