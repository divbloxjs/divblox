import { DEFAULT_DATA_MODEL_UI_CONFIG_PATH } from "../constants.js";
import { getConfig } from "../index.js";
import * as cliHelpers from "dx-cli-tools/helpers.js";
import { syncDataModelUiConfig } from "../data-model/index.js";
import path from "path";

import {
    cpSync,
    readdirSync,
    statSync,
    readFileSync,
    writeFileSync,
    renameSync,
    existsSync,
    mkdirSync,
    rmSync,
} from "fs";
import { fileURLToPath } from "url";
import { convertCamelCaseToPascalCase, isJsonString } from "dx-utilities";

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

const replaceStaticTokens = async (configOptions, entityName) => {};

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
    cpSync(`${divbloxTemplateDir}/_helpers`, `${tempTemplateDir}/_helpers`, { recursive: true });
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

    // newFilePaths.forEach((filePath) => replaceTokensInFile(filePath, tokenValues));

    console.log("newFilePaths", newFilePaths);
    const codeGenComponentsDir = configOptions?.dxConfig?.codeGen?.componentsPath;
    const codeGenRoutesDir = configOptions?.dxConfig?.codeGen?.routesPath;

    const createFormPath = `${process.cwd()}${codeGenComponentsDir}/data-model/${entityName}/${entityName}-form-create.svelte`;
    const updateFormPath = `${process.cwd()}${codeGenComponentsDir}/data-model/${entityName}/${entityName}-form-update.svelte`;
    const dataListPath = `${process.cwd()}${codeGenComponentsDir}/data-model/${entityName}/${entityName}-data-list.svelte`;
    const dataTablePath = `${process.cwd()}${codeGenComponentsDir}/data-model/${entityName}/${entityName}-data-table.svelte`;

    const formTokenValues = await getFormTokenValues(entityName, tokenValues);
    // Loop over every file in the temp folder and replace simple tokens in file content
    newFilePaths.forEach((filePath) => replaceTokensInFile(filePath, formTokenValues));
    // replaceTokensInFile(createFormPath, formTokenValues);
    // replaceTokensInFile(updateFormPath, formTokenValues);

    // const placeOptions = $page.data?.placeOptions ?? [];
    // const parentOrganisationOptions = $page.data?.parentOrganisationOptions ?? [];

    cpSync(`${tempTemplateDir}/${entityName}`, `${process.cwd()}/${codeGenComponentsDir}/data-model/${entityName}`, {
        recursive: true,
        errorOnExist: false,
        force: false,
    });

    cpSync(`${tempTemplateDir}/_helpers`, `${process.cwd()}/${codeGenComponentsDir}/data-model/_helpers`, {
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

    await generateDataTableConfig(entityName, codeGenComponentsDir);
    await generateDataListConfig(entityName, codeGenComponentsDir);

    rmSync(tempTemplateDir, { recursive: true });
};

const generateDataTableConfig = async (entityName, codeGenComponentsDir) => {
    const { dataModel, dataModelUiConfig } = await getConfig();

    const attributes = dataModelUiConfig[entityName];
    const relationships = Object.keys(dataModel[entityName].relationships);

    const dataTableConfigPath = `${process.cwd()}${codeGenComponentsDir}/data-model/${entityName}/data-series/${entityName}-data-table.config.json`;

    let dataTableConfig = {};
    if (existsSync(dataTableConfigPath)) {
        const existingDataTableConfigString = readFileSync(dataTableConfigPath);
        if (isJsonString(existingDataTableConfigString)) {
            dataTableConfig = JSON.parse(existingDataTableConfigString);
        }
    }

    let columnDisplayIndex = 1;
    Object.keys(attributes).forEach((attributeName) => {
        if (existsSync(dataTableConfigPath)) {
            columnDisplayIndex = dataTableConfig[attributeName]?.column
                ? dataTableConfig[attributeName]?.column + 1
                : columnDisplayIndex++;
            return;
        }

        dataTableConfig[attributeName] = {
            displayName: attributes[attributeName]?.displayName ?? attributeName,
            type: attributes[attributeName]?.type ?? "text",
            column: columnDisplayIndex,
        };
        columnDisplayIndex++;
    });

    relationships.forEach((relationshipName) => {
        if (dataTableConfig[relationshipName]) {
            columnDisplayIndex = Object.values(dataTableConfig[relationshipName])[0]?.column
                ? Object.values(dataTableConfig[relationshipName])[0]?.column + 1
                : columnDisplayIndex++;
            return;
        }

        dataTableConfig[relationshipName] = {};
        Object.keys(dataModelUiConfig[relationshipName]).forEach((relatedAttributeName) => {
            dataTableConfig[relationshipName][relatedAttributeName] = {
                displayName: dataModelUiConfig[relationshipName][relatedAttributeName]?.displayName ?? relationshipName,
                type: dataModelUiConfig[relationshipName][relatedAttributeName]?.type ?? "text",
                column: columnDisplayIndex,
            };
            columnDisplayIndex++;
        });
    });

    writeFileSync(
        `${process.cwd()}${codeGenComponentsDir}/data-model/${entityName}/data-series/${entityName}-data-table.config.json`,
        JSON.stringify(dataTableConfig, null, "\t"),
        { encoding: "utf-8" },
    );
};

const generateDataListConfig = async (entityName, codeGenComponentsDir) => {
    const { dataModel, dataModelUiConfig } = await getConfig();

    const attributes = dataModelUiConfig[entityName];
    const relationships = Object.keys(dataModel[entityName].relationships);

    const dataListConfigPath = `${process.cwd()}${codeGenComponentsDir}/data-model/${entityName}/data-series/${entityName}-data-list.config.json`;

    let dataListConfig = {};
    if (existsSync(dataListConfigPath)) {
        const existingDataTableConfigString = readFileSync(dataListConfigPath);
        if (isJsonString(existingDataTableConfigString)) {
            dataListConfig = JSON.parse(existingDataTableConfigString);
        }
    }

    let columnDisplayIndex = 1;
    Object.keys(attributes).forEach((attributeName) => {
        if (existsSync(dataListConfigPath)) {
            columnDisplayIndex = dataListConfig[attributeName]?.column
                ? dataListConfig[attributeName]?.column + 1
                : columnDisplayIndex++;
            return;
        }

        dataListConfig[attributeName] = {
            displayName: attributes[attributeName]?.displayName ?? attributeName,
            type: attributes[attributeName]?.type ?? "text",
            column: columnDisplayIndex,
        };
        columnDisplayIndex++;
    });

    relationships.forEach((relationshipName) => {
        if (dataListConfig[relationshipName]) {
            columnDisplayIndex = Object.values(dataListConfig[relationshipName])[0]?.column
                ? Object.values(dataListConfig[relationshipName])[0]?.column + 1
                : columnDisplayIndex++;
            return;
        }

        dataListConfig[relationshipName] = {};
        Object.keys(dataModelUiConfig[relationshipName]).forEach((relatedAttributeName) => {
            dataListConfig[relationshipName][relatedAttributeName] = {
                displayName: dataModelUiConfig[relationshipName][relatedAttributeName]?.displayName ?? relationshipName,
                type: dataModelUiConfig[relationshipName][relatedAttributeName]?.type ?? "text",
                column: columnDisplayIndex,
            };
            columnDisplayIndex++;
        });
    });

    writeFileSync(
        `${process.cwd()}${codeGenComponentsDir}/data-model/${entityName}/data-series/${entityName}-data-list.config.json`,
        JSON.stringify(dataListConfig, null, "\t"),
        { encoding: "utf-8" },
    );
};

const getFormTokenValues = async (entityName, tokenValues) => {
    const formTokenValues = {
        ...tokenValues,
        __relatedEntitiesOptions__: "",
        __formValues__: "",
        __formValueComponents__: "",
    };

    const { dataModel, dataModelUiConfig } = await getConfig();

    const attributes = dataModelUiConfig[entityName];
    const relationships = Object.keys(dataModel[entityName].relationships);

    let relatedEntitiesOptionsString = ``;
    relationships.forEach((relationshipName) => {
        relatedEntitiesOptionsString += `\tconst ${relationshipName}Options = $page.data?.${relationshipName}Options ?? []; \n`;
    });

    formTokenValues.__relatedEntitiesOptions__ = relatedEntitiesOptionsString;

    let formValuesString = `\tconst formValues = { \n`;
    formValuesString += `\t\tid: $page?.data?.${entityName}?.id ?? $page?.form?.id ?? '',\n`;

    Object.keys(attributes).forEach((attributeName) => {
        formValuesString += `\t\t${attributeName}:
            $page?.data?.${entityName}?.${attributeName} ??
            $page?.form?.${attributeName} ??
            ${attributes[attributeName].defaultValue ?? "''"},\n`;
    });

    relationships.forEach((relationshipName) => {
        formValuesString += `\t\t${relationshipName}Id:
            $page?.data?.${entityName}?.${relationshipName}Id?.toString() ?? $page?.form?.${relationshipName}Id?.toString() ?? 'null',\n`;
    });

    formValuesString += `\t}`;

    formTokenValues.__formValues__ = formValuesString;
    // console.log("attributes", attributes);
    console.log("relationships", relationships);
    console.log("attributes", attributes);

    let formValueComponentsString = ``;
    Object.keys(attributes).forEach((attributeName) => {
        formValueComponentsString += `\t<InputText bind:value={formValues.${attributeName}} attributeName="${attributeName}" labelValue="${attributes[attributeName].displayName}" />\n`;
    });
    relationships.forEach((relationshipName) => {
        formValueComponentsString += `\t<InputSelect bind:value={formValues.${relationshipName}Id} attributeName="${relationshipName}Id" labelValue="__displayName__" options={${relationshipName}Options}/>\n`;
    });
    formTokenValues.__formValueComponents__ = formValueComponentsString;

    return formTokenValues;
};

//#region Helpers
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
//#endregion
