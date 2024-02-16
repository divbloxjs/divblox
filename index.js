import { initDivblox } from "./init.js";
import { syncDatabase } from "dx-db-sync";

/**
 * Performs a divblox initialization.
 * Generates the necessary folder structure as well as installing all
 * the necessary Divblox dependencies
 * @param {boolean} overwrite
 */
export const doInit = async (overwrite = false) => {
    await initDivblox(overwrite);
};

export const doDatabaseSync = async () => {
    await syncDatabase(
        {
            databaseCaseImplementation: "snakecase",
            databaseConfigPath: `divblox/configs/dx.config.json`,
            dataModelPath: `divblox/configs/datamodel.json`,
        },
        false,
    );
};

export const generateCrud = () => {
    console.log("Generating CRUD");
};
