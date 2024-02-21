import { initDivblox } from "./init/index.js";
import { syncDatabase } from "./sync/index.js";
import {
    DB_IMPLEMENTATION_TYPES,
    DEFAULT_DATABASE_CONFIG_PATH,
    DEFAULT_DATA_MODEL_PATH,
    DEFAULT_DX_CONFIG_PATH,
} from "./constants.js";
import { isJsonString } from "dx-utilities";
import { readFileSync } from "fs";
import { printErrorMessage } from "dx-cli-tools";

/**
 * Performs a divblox initialization.
 * Generates the necessary folder structure as well as installing all
 * the necessary Divblox dependencies
 * @param {boolean} overwrite
 */
export const doInit = async (overwrite = false) => {
    await initDivblox(overwrite);
};

export const doDatabaseSync = async (skipUserPrompts = false) => {
    const configOptions = await getConfig();
    await syncDatabase(configOptions, skipUserPrompts);
    process.exit(0);
};

export const generateCrud = () => {
    console.log("Generating CRUD");
};

export const getConfig = async (dxConfigPath = DEFAULT_DX_CONFIG_PATH) => {
    let dxConfig;
    try {
        const { default: fileDxConfig } = await import(`${process.env.PWD}/${dxConfigPath}`);
        dxConfig = fileDxConfig;
    } catch (err) {
        printErrorMessage(`Divblox not configured correctly. No dx.config.js file found... 
Please run 'divblox --init'`);
        console.log(err);
        process.exit(1);
    }

    const dataModelPath = dxConfig?.dataModelPath ?? DEFAULT_DATA_MODEL_PATH;
    const databaseConfigPath = dxConfig?.databaseConfigPath ?? DEFAULT_DATABASE_CONFIG_PATH;

    let { default: databaseConfig } = await import(`${process.env.PWD}/${databaseConfigPath}`);

    const dataModelString = readFileSync(`${process.env.PWD}/${dataModelPath}`, { encoding: "utf-8" }).toString();
    if (!isJsonString(dataModelString)) {
        printErrorMessage("Data model not provided as JSON");
        process.exit(1);
    }
    const dataModel = JSON.parse(dataModelString);

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
