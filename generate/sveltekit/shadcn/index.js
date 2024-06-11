import { DEFAULT_DATA_MODEL_UI_CONFIG_PATH } from "../../../constants.js";
import { getConfig } from "../../../index.js";
import * as cliHelpers from "dx-cli-tools/helpers.js";
import { syncDataModelUiConfig } from "../../../data-model/index.js";
import { getCaseNormalizedString } from "../../../sync/sqlCaseHelpers.js";
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
    isEmptyObject,
    isJsonString,
    getSentenceCase,
} from "dx-utilities";

let configOptions = {};

export const generateShadcnCrudForEntity = async (entityName) => {
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
        __entityNamePascalCase__: convertCamelCaseToPascalCase(entityName),
        __entityNameSqlCase__: entityNameSqlCase,
        __componentsPathAlias__: configOptions.dxConfig?.codeGen?.componentsPath?.alias ?? "$lib/dx-components/",
        __routesPathAlias__: configOptions.dxConfig?.codeGen?.routesPath?.alias ?? "/src/routes/",
    };

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.resolve(path.dirname(__filename), "..");
    const initialTemplateDir = path.join(__dirname, "/shadcn/templates");
    const tempTemplateDir = path.join(__dirname, "/shadcn/temp-generated");

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

    serverTokenValues.__entityRowHtml__;
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
        __attributeSchemaDefinition__: "",
        __relatedEntitiesOptions__: "",
        __formValues__: "",
        __formValueComponents__: "",
    };

    if (isEmptyObject(configOptions)) configOptions = await getConfig();
    const { dataModel, dataModelUiConfig } = configOptions;

    const attributes = dataModelUiConfig[entityName];
    const relationships = Object.keys(dataModel[entityName].relationships);

    let relatedEntitiesOptionsString = ``;
    relationships.forEach((relationshipName) => {
        relatedEntitiesOptionsString += `\tconst ${relationshipName}Options = $page.data?.${relationshipName}Options ?? []; \n`;
    });

    formTokenValues.__relatedEntitiesOptions__ = relatedEntitiesOptionsString;

    let attributeSchemaDefinitionString = ``;
    Object.keys(attributes).forEach((attributeName, index) => {
        if (index !== 0) {
            attributeSchemaDefinitionString += `\t`;
        }
        attributeSchemaDefinitionString += `${attributeName}: ${
            attributes[attributeName].zodDefinition ?? "z.string().trim().min(1, 'Required'),\n"
        }`;
    });

    relationships.forEach((relationshipName) => {
        attributeSchemaDefinitionString += `\t${relationshipName}Id: z.string().trim(),\n`;
    });

    attributeSchemaDefinitionString = attributeSchemaDefinitionString.slice(0, -2);
    formTokenValues.__attributeSchemaDefinition__ = attributeSchemaDefinitionString;

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.resolve(path.dirname(__filename), "..");

    const formCheckboxString = readFileSync(
        `${__dirname}/shadcn/templates/_form-partial-templates/form-checkbox.tpl.svelte`,
        {
            encoding: "utf-8",
        },
    );

    const formInputString = readFileSync(
        `${__dirname}/shadcn/templates/_form-partial-templates/form-input.tpl.svelte`,
        {
            encoding: "utf-8",
        },
    );

    const formTextareaString = readFileSync(
        `${__dirname}/shadcn/templates/_form-partial-templates/form-textarea.tpl.svelte`,
        {
            encoding: "utf-8",
        },
    );

    const formSelectString = readFileSync(
        `${__dirname}/shadcn/templates/_form-partial-templates/form-select.tpl.svelte`,
        {
            encoding: "utf-8",
        },
    );

    let formValueComponentsString = ``;
    Object.keys(attributes).forEach((attributeName) => {
        const type = attributes[attributeName].type;
        let formTemplateString = formInputString;
        if (type === "checkbox") {
            formTemplateString = formCheckboxString;
        } else if (type === "select") {
            formTemplateString = formSelectString;
        } else if (type === "textarea") {
            formTemplateString = formTextareaString;
        }

        formTemplateString = formTemplateString.replaceAll("__inputType__", type);
        formTemplateString = formTemplateString.replaceAll("__name__", attributeName);
        formTemplateString = formTemplateString.replaceAll("__labelName__", getSentenceCase(attributeName));
        formTemplateString += `\n`;
        formValueComponentsString += `\t${formTemplateString}\n`;
    });

    relationships.forEach((relationshipName) => {
        let formTemplateString = formSelectString;
        formTemplateString = formTemplateString.replaceAll("__name__", relationshipName);
        formTemplateString = formTemplateString.replaceAll("__labelName__", getSentenceCase(relationshipName));
        formTemplateString += `\n\t`;
        formValueComponentsString += formTemplateString;
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
        serverTokenValues.__entityRowHtml__ += `<p>{${entityName}Data.${attributeName}}</p>\n`;
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
        const relationshipNameSqlCase = getCaseNormalizedString(
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
        const associatedEntityNameSqlCase = getCaseNormalizedString(
            associatedEntityName,
            configOptions.dxConfig.databaseCaseImplementation,
        );

        const entityNameForeignKeySqlCase = getCaseNormalizedString(
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
