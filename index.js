import { initDivblox, initOrm } from "./init/index.js";
import { syncDatabase } from "./sync/index.js";
import {
    DB_IMPLEMENTATION_TYPES,
    DEFAULT_DATABASE_CONFIG_PATH,
    DEFAULT_DATA_MODEL_PATH,
    DEFAULT_DX_CONFIG_PATH,
} from "./constants.js";
import { isJsonString } from "dx-utilities";
import { readFileSync } from "fs";
import { printErrorMessage, printInfoMessage } from "dx-cli-tools";
import { pullDataModel, pushDataModel } from "./data-model/index.js";
import { pathToFileURL } from "url";

/**
 * Performs a divblox initialization.
 * Generates the necessary folder structure as well as installing all
 * the necessary Divblox dependencies
 * @param {boolean} overwrite
 */
export const doInit = async (overwrite = false) => {
    const configOptions = await getConfig();
    await initDivblox(overwrite);
    await initOrm(configOptions.dxConfig.ormImplementation);
};

export const doDatabaseSync = async (skipUserPrompts = false, skipPullDataModel = false) => {
    const configOptions = await getConfig();
    const dxApiKey = configOptions?.dxConfig?.dxApiKey;

    if (!skipPullDataModel) {
        // Flag passed to NOT skip data model pull
        if (dxApiKey) {
            // Divblox API key configured in dx.config.js
            await pullDataModel(dxApiKey, configOptions.dxConfig.dataModelPath, "core");
        } else {
            printInfoMessage(
                "Skipped data model pull: \n" +
                    "No dxApiKey present in 'dx.config.js'. \n" +
                    "Please update the file with your project's Divblox API key.`",
            );
        }
    }

    await syncDatabase(configOptions, skipUserPrompts);

    process.exit(0);
};

export const doDataModelAction = async (action = "pull", uniqueIdentifier = "core") => {
    const config = await getConfig();
    const dxApiKey = config?.dxConfig?.dxApiKey;

    if (!dxApiKey) {
        printErrorMessage(
            `No dxApiKey present in dx.config.js. Please update the file with your project's Divblox API key.`,
        );
        process.exit(1);
    }

    if (action === "push") {
        await pushDataModel(dxApiKey, config.dataModel, uniqueIdentifier);
    } else if (action === "pull") {
        await pullDataModel(dxApiKey, config.dxConfig.dataModelPath, uniqueIdentifier);
    }

    process.exit(0);
};

export const generateCrud = () => {
    console.log("Generating CRUD");
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

    const databaseConfigPath = `${process.cwd()}/${dxConfig?.databaseConfigPath ?? DEFAULT_DATABASE_CONFIG_PATH}`;

    let databaseConfig;
    try {
        let { default: fileDatabaseConfig } = await import(pathToFileURL(databaseConfigPath).href);
        databaseConfig = fileDatabaseConfig;
    } catch (err) {
        printErrorMessage(
            `Database configuration file '${databaseConfigPath}' not found... Please check your dx.config.js.`,
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
            `Database configuration file '${databaseConfigPath}' not found... Please check your dx.config.js.`,
        );
        console.log(err);
        process.exit(1);
    }

    // Node ENV database credentials
    if (process.env.DB_HOST) databaseConfig.host = process.env.DB_HOST;
    if (process.env.DB_USER) databaseConfig.user = process.env.DB_USER;
    if (process.env.DB_PASSWORD) databaseConfig.password = process.env.DB_PASSWORD;
    if (process.env.DB_PORT) databaseConfig.port = process.env.DB_PORT;
    if (process.env.DB_SSL) databaseConfig.ssl = process.env.DB_SSL;

    if (isJsonString(databaseConfig.ssl)) {
        databaseConfig.ssl = JSON.parse(databaseConfig.ssl);
    } else {
        databaseConfig.ssl = false;
    }

    // Node ENV config variables
    if (process.env.ENV) dxConfig.environment = process.env.ENV;
    if (process.env.DB_CASE) dxConfig.databaseCaseImplementation = process.env.DB_CASE;
    if (process.env.DX_API_KEY) dxConfig.dxApiKey = process.env.DX_API_KEY;

    return {
        dxConfig: dxConfig,
        dataModel: dataModel,
        databaseConfig: databaseConfig,
    };
};
