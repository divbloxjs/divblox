import { DEFAULT_DATA_MODEL_UI_CONFIG_PATH } from "../../../constants.js";
import { getConfig } from "../../../index.js";
import * as cliHelpers from "dx-cli-tools/helpers.js";
import { syncDataModelUiConfig } from "../../../data-model/index.js";
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
import {
    convertCamelCaseToPascalCase,
    getCamelCaseSplittedToLowerCase,
    getSentenceCase,
    isEmptyObject,
    isJsonString,
} from "dx-utilities";
import { getSqlFromCamelCase } from "../../../sync/sqlCaseHelpers.js";

let configOptions = {};

export const generateVanillaCrudForEntity = async (entityName) => {
    if (isEmptyObject(configOptions)) configOptions = await getConfig();

    if (!Object.keys(configOptions.dataModel).includes(entityName)) {
        cliHelpers.printErrorMessage(`${entityName} is not defined in the data model`);
        process.exit();
    }

    await syncDataModelUiConfig(configOptions);
    await createTemplateFoldersAndFiles(configOptions, entityName);

    cliHelpers.printSuccessMessage("syncDataModelUiConfig done!");
};

const createTemplateFoldersAndFiles = async (configOptions, entityName) => {
    if (configOptions.dxConfig?.webFramework?.toLowerCase() !== "sveltekit") {
        cliHelpers.printErrorMessage(
            `Unsupported web framework provided: ${configOptions.dxConfig.webFramework}. Allowed options: ['sveltekit']. Please update your dx.config.js file`,
        );
        process.exit(1);
    }

    const entityNameKebabCase = getCamelCaseSplittedToLowerCase(entityName, "-");
    let entityNameSqlCase = entityName;

    if (configOptions?.dxConfig?.databaseCaseImplementation === "snakecase") {
        entityNameSqlCase = getCamelCaseSplittedToLowerCase(entityName, "_");
    } else if (configOptions?.dxConfig?.databaseCaseImplementation === "pascalcase") {
        entityNameSqlCase = convertCamelCaseToPascalCase(entityName);
    }

    const tokenValues = {
        __entityName__: entityName,
        __entityNameKebabCase__: entityNameKebabCase,
        __entityNameSqlCase__: entityNameSqlCase,
        __entityNamePascalCase__: convertCamelCaseToPascalCase(entityName),
        __uiComponentsPathAlias__: configOptions.dxConfig?.codeGen?.componentsPath?.alias ?? "$lib/dx-components/",
        __routesPathAlias__: configOptions.dxConfig?.codeGen?.routesPath?.alias ?? "$src/routes/",
    };

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.resolve(path.dirname(__filename), "..");
    const initialTemplateDir = path.join(__dirname, "/tailwindcss/templates");
    const tempTemplateDir = path.join(__dirname, "/generate/temp-generated");

    // Add templates to divblox root folder if not there
    const divbloxTemplateDir = `divblox/templates`;
    try {
        cpSync(initialTemplateDir, divbloxTemplateDir, { recursive: true, errorOnExist: false, force: false });
    } catch (err) {
        console.log("err", err);
    }

    // Copy over all templates into temp folder for processing
    cpSync(`${divbloxTemplateDir}/entity`, `${tempTemplateDir}/${entityNameKebabCase}`, { recursive: true });
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

    const codeGenComponentsDir = configOptions?.dxConfig?.codeGen?.componentsPath?.fromRoot ?? "src/lib/dx-components";
    const codeGenRoutesDir = configOptions?.dxConfig?.codeGen?.routesPath?.fromRoot ?? "src/routes";

    const formTokenValues = await getFormTokenValues(entityName, tokenValues);
    const serverTokenValues = await getServerTokenValues(entityName, formTokenValues);
    // Loop over every file in the temp folder and replace simple tokens in file content
    newFilePaths.forEach((filePath) => replaceTokensInFile(filePath, serverTokenValues));

    cpSync(
        `${tempTemplateDir}/${entityNameKebabCase}`,
        `${process.cwd()}/${codeGenComponentsDir}/data-model/${entityNameKebabCase}`,
        {
            recursive: true,
            errorOnExist: false,
            force: false,
        },
    );

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

    cpSync(`${tempTemplateDir}/route`, `${process.cwd()}/${codeGenRoutesDir}/${entityNameKebabCase}`, {
        recursive: true,
        errorOnExist: false,
        force: false,
    });

    await generateDataTableConfig(entityName, codeGenComponentsDir);
    await generateDataListConfig(entityName, codeGenComponentsDir);

    rmSync(tempTemplateDir, { recursive: true });
};

const generateDataTableConfig = async (entityName, codeGenComponentsDir) => {
    if (isEmptyObject(configOptions)) configOptions = await getConfig();
    const { dataModel, dataModelUiConfig } = configOptions;

    const entityNameKebabCase = getCamelCaseSplittedToLowerCase(entityName, "-");

    const attributes = dataModelUiConfig[entityName];
    const relationships = Object.keys(dataModel[entityName].relationships);

    const dataTableConfigPath = `${process.cwd()}${codeGenComponentsDir}/data-model/${entityNameKebabCase}/data-series/${entityNameKebabCase}-data-table.config.json`;

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
        `${process.cwd()}${codeGenComponentsDir}/data-model/${entityNameKebabCase}/data-series/${entityNameKebabCase}-data-table.config.json`,
        JSON.stringify(dataTableConfig, null, "\t"),
        { encoding: "utf-8" },
    );
};

const generateDataListConfig = async (entityName, codeGenComponentsDir) => {
    if (isEmptyObject(configOptions)) configOptions = await getConfig();
    const { dataModel, dataModelUiConfig } = configOptions;

    const entityNameKebabCase = getCamelCaseSplittedToLowerCase(entityName, "-");

    const attributes = dataModelUiConfig[entityName];
    const relationships = Object.keys(dataModel[entityName].relationships);

    const dataListConfigPath = `${process.cwd()}${codeGenComponentsDir}/data-model/${entityNameKebabCase}/data-series/${entityNameKebabCase}-data-list.config.json`;

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
        `${process.cwd()}${codeGenComponentsDir}/data-model/${entityNameKebabCase}/data-series/${entityNameKebabCase}-data-list.config.json`,
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

    if (isEmptyObject(configOptions)) configOptions = await getConfig();
    const { dataModel, dataModelUiConfig } = configOptions;

    let entityNameSqlCase = entityName;

    if (configOptions?.dxConfig?.databaseCaseImplementation === "snakecase") {
        entityNameSqlCase = getCamelCaseSplittedToLowerCase(entityName, "_");
    } else if (configOptions?.dxConfig?.databaseCaseImplementation === "pascalcase") {
        entityNameSqlCase = convertCamelCaseToPascalCase(entityName);
    }

    const attributes = dataModelUiConfig[entityName];

    const attributeCamelToSqlMap = {};
    Object.keys(attributes).forEach((attributeName) => {
        let attributeNameSqlCase = attributeName;

        if (configOptions?.dxConfig?.databaseCaseImplementation === "snakecase") {
            attributeNameSqlCase = getCamelCaseSplittedToLowerCase(attributeName, "_");
        } else if (configOptions?.dxConfig?.databaseCaseImplementation === "pascalcase") {
            attributeNameSqlCase = convertCamelCaseToPascalCase(attributeName);
        }

        attributeCamelToSqlMap[attributeName] = attributeNameSqlCase;
    });

    const relationships = Object.keys(dataModel[entityName].relationships);

    let relatedEntitiesOptionsString = ``;
    const relationshipsCamelToSqlMap = {};
    const relationshipIdsCamelToSqlMap = {};
    relationships.forEach((relationshipName) => {
        let relationshipNameSqlCase = relationshipName;
        let relationshipNameIdSqlCase = `${relationshipName}Id`;

        if (configOptions?.dxConfig?.databaseCaseImplementation === "snakecase") {
            relationshipNameSqlCase = getCamelCaseSplittedToLowerCase(relationshipName, "_");
            relationshipNameIdSqlCase = getCamelCaseSplittedToLowerCase(`${relationshipName}Id`, "_");
        } else if (configOptions?.dxConfig?.databaseCaseImplementation === "pascalcase") {
            relationshipNameSqlCase = convertCamelCaseToPascalCase(relationshipName);
            relationshipNameIdSqlCase = convertCamelCaseToPascalCase(`${relationshipName}Id`);
        }

        relationshipsCamelToSqlMap[relationshipName] = relationshipNameSqlCase;
        relationshipIdsCamelToSqlMap[relationshipName] = relationshipNameIdSqlCase;

        relatedEntitiesOptionsString += `\tconst ${relationshipName}Options = $page.data?.${relationshipName}Options ?? []; \n`;
    });

    formTokenValues.__relatedEntitiesOptions__ = relatedEntitiesOptionsString;

    let formValuesString = `\tconst formValues = { \n`;
    formValuesString += `\t\tid: $page?.data?.${entityNameSqlCase}?.id ?? $page?.form?.id ?? '',\n`;

    Object.keys(attributes).forEach((attributeName) => {
        let attributeNameSqlCase = attributeCamelToSqlMap[attributeName];

        formValuesString += `\t\t${attributeNameSqlCase}:
            $page?.data?.${entityNameSqlCase}?.${attributeNameSqlCase} ??
            $page?.form?.${attributeNameSqlCase} ??
            ${attributes[attributeName].defaultValue ?? "''"},\n`;
    });

    relationships.forEach((relationshipName) => {
        let relationshipNameSqlCase = relationshipsCamelToSqlMap[relationshipName];
        let relationshipNameIdSqlCase = relationshipIdsCamelToSqlMap[relationshipName];

        formValuesString += `\t\t${relationshipNameIdSqlCase}:
            $page?.data?.${entityNameSqlCase}?.${relationshipNameIdSqlCase}?.toString() ?? $page?.form?.${relationshipNameIdSqlCase}?.toString() ?? 'null',\n`;
    });

    formValuesString += `\t}`;

    formTokenValues.__formValues__ = formValuesString;

    let formValueComponentsString = ``;
    Object.keys(attributes).forEach((attributeName) => {
        let attributeNameSqlCase = attributeCamelToSqlMap[attributeName];
        formValueComponentsString += `\t<InputText bind:value={formValues.${attributeNameSqlCase}} attributeName="${attributeNameSqlCase}" name="${attributeNameSqlCase}" labelValue="${attributes[attributeName].displayName}" />\n`;
    });

    relationships.forEach((relationshipName) => {
        let relationshipNameSqlCase = relationshipsCamelToSqlMap[relationshipName];
        let relationshipNameIdSqlCase = relationshipIdsCamelToSqlMap[relationshipName];
        formValueComponentsString += `\t<InputSelect bind:value={formValues.${relationshipNameIdSqlCase}} attributeName="${relationshipNameIdSqlCase}" optionDisplayName="id" labelValue="${getSentenceCase(
            relationshipName,
        )}" options={${relationshipName}Options}/>\n`;
    });
    formTokenValues.__formValueComponents__ = formValueComponentsString;

    return formTokenValues;
};

const getServerTokenValues = async (entityName, tokenValues) => {
    const serverTokenValues = {
        ...tokenValues,
        __getRelatedEntityOptionsFunctionDeclarations__: "",
        __getAssociatedEntityArrayFunctionDeclarations__: "",
        __relatedEntityOptionAssignment__: "",
        __allAttributesString__: "",
        __relationshipsOptionsAssignment__: "",
        __associatedEntitiesAssignment__: "",
        __entityRowHtml__: "",
    };

    if (isEmptyObject(configOptions)) configOptions = await getConfig();
    const { dataModel, dataModelUiConfig } = configOptions;

    const attributes = Object.keys(dataModel[entityName].attributes);
    serverTokenValues.__allAttributesString__ = attributes.join('", "');

    attributes.forEach((attributeName) => {
        serverTokenValues.__entityRowHtml__ += `<p class="truncate">{${entityName}Data.${attributeName}}</p>\n`;
    });

    const relationships = Object.keys(dataModel[entityName].relationships);

    const associatedEntities = await getEntitiesRelatedTo(entityName);

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const templateOptionsString = readFileSync(
        `${__dirname}/templates/_partial-templates/get__relatedEntityNamePascalCase__Options.tpl.js`,
        { encoding: "utf-8" },
    );

    relationships.forEach((relationshipName) => {
        const relationshipNamePascalCase = convertCamelCaseToPascalCase(relationshipName);
        const relationshipNameSqlCase = getSqlFromCamelCase(
            relationshipName,
            configOptions.dxConfig.databaseCaseImplementation,
        );

        let relationshipString = templateOptionsString;
        relationshipString = relationshipString.replaceAll("__relatedEntityName__", relationshipName);
        relationshipString = relationshipString.replaceAll("__relatedEntityNameSqlCase__", relationshipNameSqlCase);
        relationshipString = relationshipString.replaceAll(
            "__relatedEntityNamePascalCase__",
            relationshipNamePascalCase,
        );

        serverTokenValues.__getRelatedEntityOptionsFunctionDeclarations__ += relationshipString;
        serverTokenValues.__relationshipsOptionsAssignment__ += `relationshipData.${relationshipName}Options = await get${relationshipNamePascalCase}Options();\n`;
    });

    const templateAssociatedEntityDefString = readFileSync(
        `${__dirname}/templates/_partial-templates/getAssociated__associatedEntityNamePascalCase__Array.tpl.js`,
        { encoding: "utf-8" },
    );

    associatedEntities.forEach((associatedEntityName) => {
        const associatedEntityNamePascalCase = convertCamelCaseToPascalCase(associatedEntityName);
        const associatedEntityNameSqlCase = getSqlFromCamelCase(
            associatedEntityName,
            configOptions.dxConfig.databaseCaseImplementation,
        );

        const entityNameForeignKeySqlCase = getSqlFromCamelCase(
            `${entityName}Id`,
            configOptions.dxConfig.databaseCaseImplementation,
        );

        let assocString = templateAssociatedEntityDefString;
        assocString = assocString.replaceAll("__associatedEntityName__", associatedEntityName);
        assocString = assocString.replaceAll("__associatedEntityNameSqlCase__", associatedEntityNameSqlCase);
        assocString = assocString.replaceAll("__associatedEntityNamePascalCase__", associatedEntityNamePascalCase);
        assocString = assocString.replaceAll("__entityName__", entityName);
        assocString = assocString.replaceAll("__entityNameForeignKeySqlCase__", entityNameForeignKeySqlCase);

        serverTokenValues.__getAssociatedEntityArrayFunctionDeclarations__ += assocString;
        serverTokenValues.__associatedEntitiesAssignment__ += `associatedData.${associatedEntityName} = await getAssociated${associatedEntityNamePascalCase}Array(${entityName}Id);\n`;
    });

    return serverTokenValues;
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

const getRelatedEntities = async (entityName) => {
    if (isEmptyObject(configOptions)) configOptions = await getConfig();
    const relationships = configOptions?.dataModel?.[entityName]?.relationships;
    return relationships;
};

const getEntitiesRelatedTo = async (entityName) => {
    if (isEmptyObject(configOptions)) configOptions = await getConfig();
    const entityNames = [];
    Object.entries(configOptions?.dataModel).forEach(([otherEntityName, entityDefinition]) => {
        if (Object.keys(entityDefinition.relationships).includes(entityName)) {
            entityNames.push(otherEntityName);
        }
    });

    return entityNames;
};
