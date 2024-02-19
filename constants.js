import { commandLineColors } from "dx-cli-tools/helpers.js";

export const DEFAULT_DATA_MODEL_PATH = "divblox/configs/datamodel.json";
export const DEFAULT_DATABASE_CONFIG_PATH = "divblox/configs/database.config.js";

export const DB_IMPLEMENTATION_TYPES = { SNAKE_CASE: "snakecase", PASCAL_CASE: "pascalcase", CAMEL_CASE: "camelcase" };

export const HEADING_FORMAT = commandLineColors.foregroundCyan + commandLineColors.bright;
export const SUB_HEADING_FORMAT = commandLineColors.foregroundCyan + commandLineColors.dim;
export const WARNING_FORMAT = commandLineColors.foregroundYellow;
export const SUCCESS_FORMAT = commandLineColors.foregroundGreen;
