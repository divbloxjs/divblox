import { initDivblox } from "./init.js";

/**
 * Performs a divblox initialization.
 * Generates the necessary folder structure as well as installing all
 * the necessary Divblox dependencies
 * @param {boolean} overwrite
 */
export const doInit = async (overwrite = false) => {
    await initDivblox(overwrite);
};

export const doDatabaseSync = () => {
    console.log("Doing database sync...");
};

export const generateCrud = () => {
    console.log("Generating CRUD");
};
