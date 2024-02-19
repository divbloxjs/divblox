import { initDivblox } from "./init/index.js";
import { syncDatabase } from "./sync/index.js";
import { DB_IMPLEMENTATION_TYPES, DEFAULT_DATABASE_CONFIG_PATH, DEFAULT_DATA_MODEL_PATH } from "./constants.js";

/**
 * Performs a divblox initialization.
 * Generates the necessary folder structure as well as installing all
 * the necessary Divblox dependencies
 * @param {boolean} overwrite
 */
export const doInit = async (overwrite = false) => {
    await initDivblox(overwrite);
};

export const doDatabaseSync = async (
    options = {
        dataModelPath: DEFAULT_DATA_MODEL_PATH,
        databaseConfigPath: DEFAULT_DATABASE_CONFIG_PATH,
        databaseCaseImplementation: DB_IMPLEMENTATION_TYPES.SNAKE_CASE,
    },
    skipUserPrompts = false,
) => {
    if (!options?.databaseCaseImplementation) options.databaseCaseImplementation = DB_IMPLEMENTATION_TYPES.SNAKE_CASE;
    if (process.env.DATABASE_CASE_IMPLEMENTATION)
        options.databaseCaseImplementation = process.env.DATABASE_CASE_IMPLEMENTATION;

    if (!options?.dataModelPath) options.dataModelPath = DEFAULT_DATA_MODEL_PATH;
    if (process.env.DATA_MODEL_PATH) options.dataModelPath = process.env.DATA_MODEL_PATH;
    let { default: fileDataModel } = await import(`${process.env.PWD}/${options.dataModelPath}`, {
        assert: { type: "json" },
    });

    if (!options?.databaseConfigPath) options.databaseConfigPath = DEFAULT_DATABASE_CONFIG_PATH;
    if (process.env.DATABASE_CONFIG_PATH) options.databaseConfigPath = process.env.DATABASE_CONFIG_PATH;
    let { default: fileDatabaseConfig } = await import(`${process.env.PWD}/${options.databaseConfigPath}`);

    await syncDatabase(
        {
            databaseCaseImplementation: options.databaseCaseImplementation,
            databaseConfig: fileDatabaseConfig,
            dataModel: fileDataModel,
        },
        skipUserPrompts,
    );
};

export const generateCrud = () => {
    console.log("Generating CRUD");
};
