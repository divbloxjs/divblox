import { initDivblox } from "./init.js";
import { syncDatabase } from "./sync/index.js";
import databaseConfig from "./templates/configs/database.config.js";

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
        dataModelPath: {},
        databaseConfigPath: {},
        databaseCaseImplementation: "snakecase",
        skipUserPrompts: false,
    },
) => {
    if (!options?.dataModel) {
        printErrorMessage("No data model path provided");
        return false;
    }

    if (!options?.databaseConfig) {
        printErrorMessage("No database server configuration path provided");
        return false;
    }

    let { default: fileDataModel } = await import(`${process.env.PWD}/${options.dataModelPath}`, {
        assert: { type: "json" },
    });

    dataModel = validateDataModel(fileDataModel);
    if (!dataModel) return false;

    let { default: fileDatabaseConfig } = await import(`${process.env.PWD}/${options.databaseConfigPath}`, {
        assert: { type: "json" },
    });

    databaseConfig = validateDataBaseConfig(fileDatabaseConfig);
    if (!databaseConfig) return false;

    await syncDatabase(
        {
            databaseCaseImplementation: "snakecase",
            databaseConfig: databaseConfig,
            dataModel: dataModel,
            skipUserPrompts: skipUserPrompts,
        },
        false,
    );
};

export const generateCrud = () => {
    console.log("Generating CRUD");
};
