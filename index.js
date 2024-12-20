import "dotenv/config";

import { initDivblox, initOrm } from "./init/index.js";
import { syncDatabase } from "./sync/index.js";
import { runOrmPostSyncActions, updateOrmConfiguration } from "./sync/orm.js";
import {
    DB_IMPLEMENTATION_TYPES,
    DEFAULT_DATABASE_CONFIG_PATH,
    DEFAULT_DATA_MODEL_PATH,
    DEFAULT_DATA_MODEL_UI_CONFIG_PATH,
    DEFAULT_DX_CONFIG_PATH,
} from "./constants.js";
import { isJsonString } from "dx-utilities";
import { readFileSync } from "fs";
import { printErrorMessage, printInfoMessage } from "dx-cli-tools";
import { pullDataModel, pushDataModel } from "./data-model/index.js";
import { pathToFileURL } from "url";
import { generateTailwindCrudForEntity } from "./generate/sveltekit/tailwindcss/index.js";
import { generateShadcnCrudForEntity } from "./generate/sveltekit/shadcn/index.js";
import { generateVanillaCrudForEntity } from "./generate/sveltekit/none/index.js";

/**
 * Performs a divblox initialization.
 * Generates the necessary folder structure as well as installing all
 * the necessary Divblox dependencies
 * @param {boolean} overwrite
 */
export const doInit = async (overwrite = false) => {
    await initDivblox(overwrite);
    const configOptions = await getConfig();
    await initOrm(configOptions.dxConfig.ormImplementation);
};

export const doDatabaseSync = async (skipUserPrompts = false, skipPullDataModel = false) => {
    let configOptions = await getConfig();

    if (!skipPullDataModel) {
        // Flag passed to NOT skip data model pull
        if (process.env.DX_API_KEY) {
            // Divblox API key configured in dx.config.js
            await pullDataModel(process.env.DX_API_KEY, configOptions.dxConfig, "core");
            // We need to update options here because the data model might have changed now.
            configOptions = await getConfig();
        } else {
            printInfoMessage(`Skipped data model pull: No env variable 'DX_API_KEY' provided.`);
        }
    }

    // Update the configuration for the provided ORM implementation, based on the provided db config
    await updateOrmConfiguration(configOptions);

    await syncDatabase(configOptions, skipUserPrompts);

    await runOrmPostSyncActions(configOptions);

    process.exit(0);
};

export const doDataModelAction = async (action = "pull", uniqueIdentifier = "core") => {
    const config = await getConfig();

    if (!process.env.DX_API_KEY) {
        printInfoMessage(`Skipped data model ${action}: No env variable 'DX_API_KEY' provided.`);
        process.exit(1);
    }

    if (action === "push") {
        await pushDataModel(process.env.DX_API_KEY, config.dataModel, uniqueIdentifier);
    } else if (action === "pull") {
        await pullDataModel(process.env.DX_API_KEY, config.dxConfig, uniqueIdentifier);
    }

    process.exit(0);
};

export const generateCrud = async (entityName) => {
    let { dxConfig } = await getConfig();

    if (dxConfig.codeGen.uiImplementation === "tailwindcss") {
        await generateTailwindCrudForEntity(entityName);
    } else if (dxConfig.codeGen.uiImplementation === "shadcn") {
        await generateShadcnCrudForEntity(entityName);
    } else if (dxConfig.codeGen.uiImplementation === "none") {
        await generateVanillaCrudForEntity(entityName);
    } else {
        printErrorMessage(
            `Invalid uiImplementation provided: '${dxConfig.codeGen.uiImplementation}'. Allowed options: ['shadcn'|'tailwindcss'|'none']`,
        );
    }

    process.exit(0);
};

export const getConfig = async (dxConfigPath = DEFAULT_DX_CONFIG_PATH) => {
    let dxConfig;
    try {
        const { default: fileDxConfig } = await import(pathToFileURL(`${process.cwd()}/${dxConfigPath}`).href);
        dxConfig = fileDxConfig;
    } catch (err) {
        printErrorMessage(
            "Divblox not configured correctly. No dx.config.js file found... \n Please run 'divblox --init'",
        );
        console.log(err);
        process.exit(1);
    }

    const dataModelPath = dxConfig?.dataModelPath ?? DEFAULT_DATA_MODEL_PATH;

    let dataModel;
    try {
        const dataModelString = readFileSync(dataModelPath, { encoding: "utf-8" }).toString();
        if (!isJsonString(dataModelString)) {
            printErrorMessage("Data model not provided as JSON");
            process.exit(1);
        }

        dataModel = JSON.parse(dataModelString);
    } catch (err) {
        printErrorMessage(
            `Data model configuration file '${dataModelPath}' not found... Please check your dx.config.js.`,
        );
        console.log(err);
        process.exit(1);
    }

    const dataModelUiConfigPath = dxConfig?.dataModelUiConfigPath ?? DEFAULT_DATA_MODEL_UI_CONFIG_PATH;

    let dataModelUiConfig = {};
    try {
        const dataModelUiConfigString = readFileSync(dataModelUiConfigPath, { encoding: "utf-8" }).toString();
        if (!isJsonString(dataModelUiConfigString)) {
            printErrorMessage("Data model not provided as JSON");
            process.exit(1);
        }

        dataModelUiConfig = JSON.parse(dataModelUiConfigString);
    } catch (err) {
        // Has not been generated yet
    }

    return { dxConfig, dataModel, dataModelUiConfig };
};
