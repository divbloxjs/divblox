import { convertLowerCaseToCamelCase, getCamelCaseSplittedToLowerCase } from "dx-utilities";
import { DB_IMPLEMENTATION_TYPES } from "../constants.js";

/**
 * Returns the given inputString, formatted to align with the case implementation specified
 * @param {string} inputString The string to normalize, expected in camelCase
 * @param {string} databaseCaseImplementation The database case to use
 * @return {string} The normalized string
 */
export const getCaseNormalizedString = (
    inputString = "",
    databaseCaseImplementation = DB_IMPLEMENTATION_TYPES.SNAKE_CASE,
) => {
    let preparedString = inputString;
    switch (databaseCaseImplementation.toLowerCase()) {
        case DB_IMPLEMENTATION_TYPES.SNAKE_CASE:
            return getCamelCaseSplittedToLowerCase(inputString, "_");
        case DB_IMPLEMENTATION_TYPES.PASCAL_CASE:
            preparedString = getCamelCaseSplittedToLowerCase(inputString, "_");
            return convertLowerCaseToPascalCase(preparedString, "_");
        case DB_IMPLEMENTATION_TYPES.CAMEL_CASE:
            preparedString = getCamelCaseSplittedToLowerCase(inputString, "_");
            return convertLowerCaseToCamelCase(preparedString, "_");
        default:
            return getCamelCaseSplittedToLowerCase(inputString, "_");
    }
};

/**
 * Returns the given inputString, formatted back to camelCase. This is because it is expected that a divblox data
 * model is ALWAYS defined using camelCase
 * @param inputString The string to denormalize
 * @param {string} databaseCaseImplementation The database case to use
 * @return {string} The denormalized string
 */
export const getCaseDenormalizedString = (
    inputString = "",
    databaseCaseImplementation = DB_IMPLEMENTATION_TYPES.SNAKE_CASE,
) => {
    // Since the data model expects camelCase, this function converts back to that
    let preparedString = inputString;
    switch (databaseCaseImplementation.toLowerCase()) {
        case DB_IMPLEMENTATION_TYPES.SNAKE_CASE:
            return convertLowerCaseToCamelCase(inputString, "_");
        case DB_IMPLEMENTATION_TYPES.PASCAL_CASE:
        case DB_IMPLEMENTATION_TYPES.CAMEL_CASE:
            preparedString = getCamelCaseSplittedToLowerCase(inputString, "_");
            return convertLowerCaseToCamelCase(preparedString, "_");
        default:
            return convertLowerCaseToCamelCase(inputString, "_");
    }
};
