import { DEFAULT_DATA_MODEL_UI_CONFIG_PATH } from "../../../constants.js";
import { getConfig } from "../../../index.js";
import * as cliHelpers from "dx-cli-tools/helpers.js";
import { syncDataModelUiConfig } from "../../../data-model/index.js";
import { getSqlFromCamelCase } from "../../../sync/sqlCaseHelpers.js";
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
import { fileURLToPath, pathToFileURL } from "url";
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
    configOptions = await getConfig();
    await createTemplateFoldersAndFiles(entityName);

    cliHelpers.printSuccessMessage("syncDataModelUiConfig done!");
};

const createTemplateFoldersAndFiles = async (entityName) => {
    if (isEmptyObject(configOptions)) configOptions = await getConfig();

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

    const componentsJSONPath = pathToFileURL(`${process.cwd()}/components.json`);
    let fileContentStr = readFileSync(componentsJSONPath);
    fileContentStr = fileContentStr.toString();

    let uiComponentPath;
    try {
        const componentConfig = JSON.parse(fileContentStr);
        uiComponentPath = componentConfig?.aliases?.components;
        if (!uiComponentPath) throw new Error();
    } catch (err) {
        cliHelpers.printErrorMessage("Aborted");
        cliHelpers.printErrorMessage(
            "'components.json' shadcn configuration not found in project root. \n Please place it in the root of your project.",
        );
        process.exit(1);
    }

    const tokenValues = {
        __entityName__: entityName,
        __entityNameKebabCase__: entityNameKebabCase,
        __entityNamePascalCase__: convertCamelCaseToPascalCase(entityName),
        __entityNameSqlCase__: entityNameSqlCase,
        __uiComponentsPathAlias__: uiComponentPath ?? "$lib/dx-components/",
        __dataModelComponentsPathAlias__:
            configOptions.dxConfig?.codeGen?.componentsPath?.alias ?? "$lib/dx-components/",
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
    cpSync(`${divbloxTemplateDir}/_helpers`, `${tempTemplateDir}/_helpers`, { recursive: true });
    cpSync(`${divbloxTemplateDir}/_partial-components`, `${tempTemplateDir}/_partial-components`, { recursive: true });
    cpSync(`${divbloxTemplateDir}/entity`, `${tempTemplateDir}/${entityNameKebabCase}`, { recursive: true });
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
        `${process.cwd()}/${codeGenComponentsDir}/${entityNameKebabCase}`,
        {
            recursive: true,
            errorOnExist: false,
            force: false,
        },
    );

    cpSync(`${tempTemplateDir}/_helpers`, `${process.cwd()}/${codeGenComponentsDir}/_helpers`, {
        recursive: true,
        errorOnExist: false,
        force: false,
    });

    cpSync(`${tempTemplateDir}/_partial-components`, `${process.cwd()}/${codeGenComponentsDir}/_partial-components`, {
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

    const dataTableConfigPath = `${process.cwd()}${codeGenComponentsDir}/${entityNameKebabCase}/data-series/${entityNameKebabCase}-data-table.config.json`;

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
        `${process.cwd()}${codeGenComponentsDir}/${entityNameKebabCase}/data-series/${entityNameKebabCase}-data-table.config.json`,
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

    const dataListConfigPath = `${process.cwd()}${codeGenComponentsDir}/${entityNameKebabCase}/data-series/${entityNameKebabCase}-data-list.config.json`;

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
        `${process.cwd()}${codeGenComponentsDir}/${entityNameKebabCase}/data-series/${entityNameKebabCase}-data-list.config.json`,
        JSON.stringify(dataListConfig, null, "\t"),
        { encoding: "utf-8" },
    );
};

const getFormTokenValues = async (entityName, tokenValues) => {
    const formTokenValues = {
        ...tokenValues,
        __attributeSchemaDefinition__: "",
        __relatedEntitiesOptions__: "",
        __proxyDefinitions__: "",
        __formValues__: "",
        __formValueComponents__: "",
    };

    if (isEmptyObject(configOptions)) configOptions = await getConfig();
    const { dataModel, dataModelUiConfig } = configOptions;

    const dataModelAttributes = dataModel[entityName].attributes;
    const attributes = dataModelUiConfig[entityName];
    const relationships = dataModel[entityName].relationships;

    let relatedEntitiesOptionsString = ``;
    for (const [relatedEntity, relationshipNames] of Object.entries(relationships)) {
        for (const relationshipName of relationshipNames) {
            relatedEntitiesOptionsString += `\tconst ${relationshipName}Options = $page.data?.${relationshipName}Options ?? []; \n`;
        }
    }

    formTokenValues.__relatedEntitiesOptions__ = relatedEntitiesOptionsString;

    let attributeSchemaDefinitionString = ``;
    let proxyDefinitionString = ``;
    Object.keys(dataModelAttributes).forEach((attributeName, index) => {
        if (index !== 0) {
            attributeSchemaDefinitionString += `\t`;
        }

        const allowNull = dataModelAttributes[attributeName].allowNull ?? false;
        const nullableString = allowNull ? `.nullable()` : ``;

        // TODO: Finalise defaults - need a proper map for data model to zod schema.
        // TODO: Externalised in the project -> somewhere with the data model
        let defaultValue = dataModelAttributes[attributeName].default ?? undefined;
        if (typeof defaultValue === "string") {
            defaultValue = `'${defaultValue}'`;
        }
        let defaultString = defaultValue === undefined ? `` : `.default(${defaultValue})`;

        // TODO: finer adjustment based on types
        if (attributes[attributeName].type === "number") {
            // So that superforms/zod does not insert a 0
            if (!defaultString) {
                let val = allowNull ? `null` : `undefined`;
                defaultString = `.default(${val})`;
            }
            attributeSchemaDefinitionString += `${getSqlFromCamelCase(attributeName)}: ${
                attributes[attributeName].zodDefinition ??
                `z.number({ errorMap: () => ({ message: "Required" }) })${nullableString}${defaultString},\n`
            }`;
        } else if (attributes[attributeName].type === "select-enum") {
            if (!defaultString) defaultString = `.default(null)`;

            let errorMap = ``;
            if (!allowNull) {
                errorMap = `, { errorMap: () => ({ message: "Required" }) }`;
            }

            attributeSchemaDefinitionString += `${getSqlFromCamelCase(attributeName)}: ${
                attributes[attributeName].zodDefinition ??
                `z.enum([${dataModelAttributes[attributeName].lengthOrValues}]${errorMap})${nullableString}${defaultString},\n`
            }`;
        } else if (attributes[attributeName].type === "checkbox") {
            defaultString = `.default(null)`;

            if (
                dataModelAttributes[attributeName].hasOwnProperty("default") &&
                (dataModelAttributes[attributeName].default == "1" || dataModelAttributes[attributeName].default == "0")
            ) {
                defaultString = dataModelAttributes[attributeName].default == "1" ? ".default(true)" : ".default(true)";
            }

            let errorMap = ``;
            if (!allowNull) {
                errorMap = `{ errorMap: () => ({ message: "Required" }) }`;
            }

            attributeSchemaDefinitionString += `${getSqlFromCamelCase(attributeName)}: ${
                attributes[attributeName].zodDefinition ?? `z.boolean(${errorMap})${nullableString}${defaultString},\n`
            }`;
        } else if (attributes[attributeName].type === "date") {
            attributeSchemaDefinitionString += `${getSqlFromCamelCase(attributeName)}: ${
                attributes[attributeName].zodDefinition ??
                `z.date({ errorMap: () => ({ message: "Required" }) })${nullableString},\n`
            }`;

            proxyDefinitionString += `const ${attributeName}Proxy = dateProxy(form, "${getSqlFromCamelCase(
                attributeName,
            )}", { format: "date", empty: "null" });\n`;
        } else if (attributes[attributeName].type === "datetime-local") {
            attributeSchemaDefinitionString += `${getSqlFromCamelCase(attributeName)}: ${
                attributes[attributeName].zodDefinition ??
                `z.date({ errorMap: () => ({ message: "Required" }) })${nullableString},\n`
            }`;

            proxyDefinitionString += `const ${attributeName}Proxy = dateProxy(form, "${getSqlFromCamelCase(
                attributeName,
            )}", { format: "datetime-local", empty: "null" });\n`;
        } else {
            attributeSchemaDefinitionString += `${getSqlFromCamelCase(attributeName)}: ${
                attributes[attributeName].zodDefinition ?? `z.string().trim()${nullableString},\n`
            }`;
        }
    });

    for (const [relatedEntity, relationshipNames] of Object.entries(relationships)) {
        for (const relationshipName of relationshipNames) {
            attributeSchemaDefinitionString += `\t${getSqlFromCamelCase(relationshipName)}: z.number().nullable(),\n`;
        }
    }

    attributeSchemaDefinitionString = attributeSchemaDefinitionString.slice(0, -2);
    formTokenValues.__attributeSchemaDefinition__ = attributeSchemaDefinitionString;
    formTokenValues.__proxyDefinitions__ = proxyDefinitionString;

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.resolve(path.dirname(__filename), "..");

    const divbloxTemplateDir = `divblox/templates`;
    const formCheckboxString = readFileSync(`${divbloxTemplateDir}/_form-partial-templates/form-checkbox.tpl.svelte`, {
        encoding: "utf-8",
    });

    const formInputString = readFileSync(`${divbloxTemplateDir}/_form-partial-templates/form-input.tpl.svelte`, {
        encoding: "utf-8",
    });

    const formTextareaString = readFileSync(`${divbloxTemplateDir}/_form-partial-templates/form-textarea.tpl.svelte`, {
        encoding: "utf-8",
    });

    const formSelectString = readFileSync(`${divbloxTemplateDir}/_form-partial-templates/form-select.tpl.svelte`, {
        encoding: "utf-8",
    });

    const formSelectEnumString = readFileSync(
        `${divbloxTemplateDir}/_form-partial-templates/form-select-enum.tpl.svelte`,
        {
            encoding: "utf-8",
        },
    );

    let formValueComponentsString = ``;
    Object.keys(dataModelAttributes).forEach((attributeName) => {
        const type = attributes[attributeName].type;
        let formTemplateString = formInputString;
        let value = `$formData.${getSqlFromCamelCase(attributeName)}`;
        if (type === "checkbox") {
            formTemplateString = formCheckboxString;
        } else if (type === "select") {
            formTemplateString = formSelectString;
        } else if (type === "textarea") {
            formTemplateString = formTextareaString;
        } else if (type === "select-enum") {
            formTemplateString = formSelectEnumString;
            const optionsString = dataModel[entityName].attributes[attributeName].lengthOrValues;
            const options = optionsString.trim().replaceAll("'", "").replaceAll('"', "").split(",");

            const enumOptions = [];
            options.forEach((option) => {
                enumOptions.push({
                    label: option,
                    value: option,
                });
            });

            formTemplateString = formTemplateString.replaceAll("__enumOptions__", JSON.stringify(enumOptions));
        } else if (type === "date" || type === "datetime-local") {
            value = `$${attributeName}Proxy`;
        }

        formTemplateString = formTemplateString.replaceAll("__value__", value);
        formTemplateString = formTemplateString.replaceAll("__inputType__", type);
        formTemplateString = formTemplateString.replaceAll(
            "__allowNull__",
            dataModel[entityName].attributes[attributeName].allowNull ? true : false,
        );
        formTemplateString = formTemplateString.replaceAll("__placeholder__", attributes[attributeName].placeholder);
        formTemplateString = formTemplateString.replaceAll("__name__", attributeName);
        formTemplateString = formTemplateString.replaceAll("__nameSqlCase__", getSqlFromCamelCase(attributeName));
        formTemplateString = formTemplateString.replaceAll("__labelName__", getSentenceCase(attributeName));
        formTemplateString += `\n`;
        formValueComponentsString += `\t${formTemplateString}\n`;
    });

    for (const [relatedEntity, relationshipNames] of Object.entries(relationships)) {
        for (const relationshipName of relationshipNames) {
            let formTemplateString = formSelectString;
            formTemplateString = formTemplateString.replaceAll(
                "__nameSqlCase__",
                getSqlFromCamelCase(relationshipName),
            );
            formTemplateString = formTemplateString.replaceAll("__labelName__", getSentenceCase(relationshipName));
            formTemplateString = formTemplateString.replaceAll("__name__", relationshipName);
            formTemplateString += `\n\t`;
            formValueComponentsString += formTemplateString;
        }
    }

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
        serverTokenValues.__entityRowHtml__ += `<p class="truncate">{${entityName}Data.${getSqlFromCamelCase(
            attributeName,
        )}}</p>\n`;
    });

    const relationships = dataModel[entityName].relationships;

    const associatedEntities = await getEntitiesRelatedTo(entityName);

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const divbloxTemplateDir = `divblox/templates`;
    const templateOptionsString = readFileSync(
        `${divbloxTemplateDir}/_partial-templates/get__relatedEntityNamePascalCase__Options.tpl.js`,
        { encoding: "utf-8" },
    );

    for (const [relatedEntityName, relationshipNames] of Object.entries(relationships)) {
        for (const relationshipName of relationshipNames) {
            const relationshipNamePascalCase = convertCamelCaseToPascalCase(relationshipName);
            const relationshipNameSqlCase = getSqlFromCamelCase(relationshipName);

            const relatedEntityNamePascalCase = convertCamelCaseToPascalCase(relatedEntityName);
            const relatedEntityNameSqlCase = getSqlFromCamelCase(relatedEntityName);

            let relationshipString = templateOptionsString;
            relationshipString = relationshipString.replaceAll("__relationshipName__", relationshipName);
            relationshipString = relationshipString.replaceAll(
                "__relationshipNamePascalCase__",
                relationshipNamePascalCase,
            );

            relationshipString = relationshipString.replaceAll(
                "__relationshipNameSqlCase__",
                getSqlFromCamelCase(relationshipName),
            );

            relationshipString = relationshipString.replaceAll("__relatedEntityName__", relatedEntityName);
            relationshipString = relationshipString.replaceAll(
                "__relatedEntityNameSqlCase__",
                relatedEntityNameSqlCase,
            );
            relationshipString = relationshipString.replaceAll(
                "__relatedEntityNamePascalCase__",
                relatedEntityNamePascalCase,
            );

            serverTokenValues.__getRelatedEntityOptionsFunctionDeclarations__ += relationshipString;
            serverTokenValues.__relationshipsOptionsAssignment__ += `relationshipData.${relationshipName}Options = await get${relationshipNamePascalCase}Options();\n`;
        }
    }

    const templateAssociatedEntityDefString = readFileSync(
        `${divbloxTemplateDir}/_partial-templates/getAssociated__associatedEntityNamePascalCase__Array.tpl.js`,
        { encoding: "utf-8" },
    );

    associatedEntities.forEach((associatedEntityName) => {
        const associatedEntityNamePascalCase = convertCamelCaseToPascalCase(associatedEntityName);
        const associatedEntityNameSqlCase = getSqlFromCamelCase(
            associatedEntityName,
            configOptions.dxConfig.databaseCaseImplementation,
        );

        const relationshipName = dataModel[associatedEntityName].relationships[entityName][0];

        const relationshipNameSqlCase = getSqlFromCamelCase(
            relationshipName,
            configOptions.dxConfig.databaseCaseImplementation,
        );

        let assocString = templateAssociatedEntityDefString;

        assocString = assocString.replaceAll("__associatedEntityName__", associatedEntityName);
        assocString = assocString.replaceAll("__associatedEntityNamePascalCase__", associatedEntityNamePascalCase);
        assocString = assocString.replaceAll("__associatedEntityNameSqlCase__", associatedEntityNameSqlCase);

        assocString = assocString.replaceAll("__relationshipName__", relationshipName);
        assocString = assocString.replaceAll("__relationshipNameSqlCase__", relationshipNameSqlCase);

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
