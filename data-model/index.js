import { printErrorMessage, printSuccessMessage } from "dx-cli-tools";
import { isJsonString } from "dx-utilities";
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "fs";
import { DEFAULT_DATA_MODEL_UI_CONFIG_PATH } from "../constants.js";
import * as cliHelpers from "dx-cli-tools";

const baseUrl = "https://api.divblox.app";

/**
 * Handles the command line input that is used to prepare the npm package for the new project
 * @return {Promise<void>}
 */
export const pullDataModel = async (dxApiKey, dxConfig, uniqueIdentifier = "core") => {
    const dataModelPath = dxConfig.dataModelPath;

    let response;
    try {
        response = await fetch(`${baseUrl}/api/dataDesign/pullProjectDataModel/${uniqueIdentifier}`, {
            method: "POST",
            headers: { "Content-type": "application/json" },
            body: JSON.stringify({ dxApiKey: dxApiKey }),
        });

        const result = await response.json();
        if (!response.ok) {
            printErrorMessage(`Error occurred pulling data model: ${result?.message ?? "No message provided"}`);
            process.exit(1);
        }

        Object.keys(result).forEach((entityName) => {
            delete result[entityName].package;
            delete result[entityName].packageName;
            delete result[entityName].packageNameCamelCase;
            delete result[entityName].generateCrud;
        });

        writeFileSync(`${process.cwd()}/${dataModelPath}`, JSON.stringify(result, null, "\t"));

        printSuccessMessage(`Successfully pulled '${uniqueIdentifier}' data model`);
    } catch (err) {
        printErrorMessage(
            "Could not connect to divblox.app right now. You can still sync locally by running divblox -s skip-pull",
        );
        process.exit(1);
    }
};

export const syncDataModelUiConfig = async (configOptions) => {
    const dataModelPath = configOptions.dxConfig.dataModelPath;
    const dataModel = configOptions.dataModel;
    const dataModelUiConfigPath =
        configOptions?.dxConfig?.codeGen?.dataModelUiConfigPath ?? DEFAULT_DATA_MODEL_UI_CONFIG_PATH;
    const codeGenFolder = dataModelUiConfigPath.replace("/datamodel-ui.config.json", "");

    // TODO create all folders if not exists
    // Recursively crete folders? check
    if (!existsSync(codeGenFolder)) {
        mkdirSync(codeGenFolder, { recursive: true });
        cliHelpers.printInfoMessage(`Created code gen directory: ${codeGenFolder}`);
    }

    if (!existsSync(dataModelUiConfigPath)) {
        writeFileSync(dataModelUiConfigPath, JSON.stringify({}));
    }

    let dataModelUiConfig;
    try {
        const dataModelUiConfigString = readFileSync(dataModelUiConfigPath, { encoding: "utf-8" }).toString();
        if (!isJsonString(dataModelUiConfigString)) {
            printErrorMessage("Data model not provided as JSON");
            process.exit(1);
        }

        dataModelUiConfig = JSON.parse(dataModelUiConfigString);
    } catch (err) {
        console.log(err);
        process.exit(1);
    }

    Object.keys(dataModel).forEach((entityName) => {
        if (!dataModelUiConfig.hasOwnProperty(entityName)) {
            dataModelUiConfig[entityName] = {};
        }

        Object.keys(dataModel[entityName].attributes).forEach((attributeName) => {
            if (!dataModelUiConfig[entityName].hasOwnProperty(attributeName)) {
                dataModelUiConfig[entityName][attributeName] = {
                    type:
                        dataModelSqlToInputMap[dataModel[entityName].attributes[attributeName].type.toUpperCase()] ??
                        "text",
                    displayName: attributeName,
                    placeholder: attributeName,
                    default: "",
                };
            }
        });
    });

    writeFileSync(`${process.cwd()}/${dataModelUiConfigPath}`, JSON.stringify(dataModelUiConfig, null, "\t"));
};

const dataModelSqlToInputMap = {
    CHAR: "text",
    VARCHAR: "text",
    TEXT: "textarea",
    MEDIUMTEXT: "textarea",
    LONGTEXT: "textarea",
    ENUM: "select",
    SET: "select",
    TINYINT: "checkbox",
    BOOLEAN: "checkbox",
    MEDIUMINT: "number",
    FLOAT: "number",
    INT: "number",
    SMALLINT: "number",
    BIGINT: "number",
    DOUBLE: "number",
    DECIMAL: "number",
    DATE: "date",
    DATETIME: "datetime",
    TIMESTAMP: "datetime",
    YEAR: "number",
    TIME: "time",
    JSON: "textarea",
};

export const pushDataModel = async (dxApiKey, dataModel, uniqueIdentifier = "core") => {
    let response;
    try {
        response = await fetch(`${baseUrl}/api/dataDesign/pushProjectDataModel/${uniqueIdentifier}`, {
            method: "POST",
            headers: { "Content-type": "application/json" },
            body: JSON.stringify({ dxApiKey: dxApiKey, modelJson: dataModel }),
        });

        const result = await response.json();
        if (!response.ok) {
            printErrorMessage(`Error occurred pushing data model: ${result?.message ?? "No message provided"}`);
            process.exit(1);
        }

        printSuccessMessage(`Successfully pushed '${uniqueIdentifier}' data model`);
    } catch (err) {
        printErrorMessage("Could not connect to divblox.app right now");
        process.exit(1);
    }
};
