import { initDivblox } from "./init.js";

export const doInit = async (overwrite = false) => {
    await initDivblox(overwrite);
};

export const doDatabaseSync = () => {
    console.log("Doing database sync...");
};

export const generateCrud = () => {
    console.log("Generating CRUD");
};
