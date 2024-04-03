import { DEFAULT_DATA_MODEL_UI_CONFIG_PATH } from "../constants.js";
import { getConfig } from "../index.js";
import * as cliHelpers from "dx-cli-tools/helpers.js";
import { syncDataModelUiConfig } from "../data-model/index.js";

export const generateCrudForEntity = async (entityName) => {
    const configOptions = await getConfig();

    if (!Object.keys(configOptions.dataModel).includes(entityName)) {
        cliHelpers.printErrorMessage(`${entityName} is not defined in the data model`);
        process.exit();
    }

    await syncDataModelUiConfig(configOptions);

    cliHelpers.printSuccessMessage("syncDataModelUiConfig done!");
};
