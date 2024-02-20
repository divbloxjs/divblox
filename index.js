import { initDivblox } from "./init/index.js";
import { syncDatabase } from "./sync/index.js";
import {
    DB_IMPLEMENTATION_TYPES,
    DEFAULT_DATABASE_CONFIG_PATH,
    DEFAULT_DATA_MODEL_PATH,
    DEFAULT_DX_CONFIG_PATH,
} from "./constants.js";

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
};

export const generateCrud = () => {
    console.log("Generating CRUD");
};

export const getConfig = async (dxConfigPath = DEFAULT_DX_CONFIG_PATH) => {
    let { default: dxConfig } = await import(`${process.env.PWD}/${dxConfigPath}`);

    const dataModelPath = dxConfig?.dataModelPath ?? DEFAULT_DATA_MODEL_PATH;
    const databaseConfigPath = dxConfig?.databaseConfigPath ?? DEFAULT_DATABASE_CONFIG_PATH;

    let { default: databaseConfig } = await import(`${process.env.PWD}/${databaseConfigPath}`);
    let { default: dataModel } = await import(`${process.env.PWD}/${dataModelPath}`, {
        assert: { type: "json" },
    });

    // Node ENV database credentials
    if (process.env.DB_HOST) databaseConfig.host = process.env.DB_HOST;
    if (process.env.DB_USER) databaseConfig.user = process.env.DB_USER;
    if (process.env.DB_PASSWORD) databaseConfig.password = process.env.DB_PASSWORD;
    if (process.env.DB_PORT) databaseConfig.port = process.env.DB_PORT;
    if (process.env.DB_SSL) databaseConfig.ssl = process.env.DB_SSL;

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
