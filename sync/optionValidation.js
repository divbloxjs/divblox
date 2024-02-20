import { outputFormattedLog, printErrorMessage } from "dx-cli-tools/helpers.js";
import { isValidObject, arePrimitiveArraysEqual } from "dx-utilities";
import { SUB_HEADING_FORMAT } from "../constants.js";
import { getCaseNormalizedString } from "./sqlCaseHelpers.js";

let dataModel = {};
let dataModelCased = {};
export const validateDataModel = (dataModelToCheck = {}) => {
    dataModel = dataModelToCheck;
    if (!dataModelToCheck) {
        printErrorMessage("No data model provided");
        return false;
    }

    if (!isValidObject(dataModelToCheck)) {
        printErrorMessage("Data model is not a valid object");
        return false;
    }

    for (const [entityNameToCheck, entityDefinitionToCheck] of Object.entries(dataModelToCheck)) {
        if (!entityDefinitionToCheck?.module) {
            printErrorMessage(`${entityNameToCheck} does not have a module configured`);
            return false;
        }

        if (!entityDefinitionToCheck?.attributes) {
            printErrorMessage(`${entityNameToCheck} does not have any attributes configured`);
            return false;
        }

        if (!entityDefinitionToCheck?.indexes) {
            entityDefinitionToCheck.indexes = [];
        }

        if (!entityDefinitionToCheck?.relationships) {
            entityDefinitionToCheck.relationships = {};
        }

        if (!entityDefinitionToCheck?.options) {
            entityDefinitionToCheck.options = {
                enforceLockingConstraints: true,
                isAuditEnabled: true,
            };
        }

        if (!isValidObject(entityDefinitionToCheck.attributes)) {
            printErrorMessage(`${entityNameToCheck} attributes are not provided as an object`);
            return false;
        }

        if (Object.keys(entityDefinitionToCheck.attributes).length === 0) {
            printErrorMessage(`Entity '${entityNameToCheck}' has no attributes provided`);
            return false;
        }

        const entityNameCased = getCaseNormalizedString(entityNameToCheck);
        const entityDefinitionCased = {
            attributes: [],
            indexes: [],
            relationships: {},
            options: entityDefinitionToCheck.options,
        };
        entityDefinitionCased.module = getCaseNormalizedString(entityDefinitionToCheck.module);

        for (const [attributeName, attributeDefinition] of Object.entries(entityDefinitionToCheck.attributes)) {
            const isValidAttribute = validateAttribute(entityNameToCheck, attributeName, attributeDefinition);
            if (!isValidAttribute) return false;
            entityDefinitionCased.attributes[getCaseNormalizedString(attributeName)] = attributeDefinition;
        }

        if (!Array.isArray(entityDefinitionToCheck.indexes)) {
            printErrorMessage(`${entityNameToCheck} indexes are not provided as an array`);
            return false;
        }

        for (const indexDefinition of entityDefinitionToCheck.indexes) {
            const isValidIndex = validateIndex(entityNameToCheck, indexDefinition);
            if (!isValidIndex) return false;
            indexDefinition.attribute = getCaseNormalizedString(indexDefinition.attribute);
            entityDefinitionCased.indexes.push(indexDefinition);
        }

        if (!isValidObject(entityDefinitionToCheck.relationships)) {
            printErrorMessage(`${entityNameToCheck} relationships are not provided as an object`);
            return false;
        }

        for (const [relationshipName, relationshipAttributes] of Object.entries(
            entityDefinitionToCheck.relationships,
        )) {
            const isValidRelationship = validateRelationship(
                entityNameToCheck,
                relationshipName,
                relationshipAttributes,
            );
            if (!isValidRelationship) return false;
            entityDefinitionCased.relationships[getCaseNormalizedString(relationshipName)] = relationshipAttributes.map(
                (attribute) => getCaseNormalizedString(attribute),
            );
        }

        if (!isValidObject(entityDefinitionToCheck.options)) {
            printErrorMessage(`${entityNameToCheck} options are not provided as an object`);
            return false;
        }

        dataModelCased[entityNameCased] = entityDefinitionCased;

        // validateOptions();
    }

    outputFormattedLog("Initial data model validation passed!", SUB_HEADING_FORMAT);
    return dataModelCased;
};

//#region Data Model Validation Helpers
const validateAttribute = (entityName, attributeName, attributeDefinition = {}) => {
    const expectedAttributeDefinition = {
        name: "attribute name",
        type: "[MySQL column type]",
        lengthOrValues: "[null|int|if type is enum, then comma separated values '1','2','3',...]",
        default: "[value|null|CURRENT_TIMESTAMP]",
        allowNull: "[true|false]",
    };

    const attributeProperties = Object.keys(attributeDefinition);
    if (!arePrimitiveArraysEqual(attributeProperties, Object.keys(expectedAttributeDefinition))) {
        printErrorMessage(`Invalid attribute definition for '${entityName}' (${attributeName})`);
        console.log("Provided: ", attributeDefinition);
        console.log("Expected: ", expectedAttributeDefinition);
        return false;
    }

    return true;
};

const validateIndex = (entityName, indexDefinition = {}) => {
    const allowedIndexChoices = ["index", "unique", "spatial", "fulltext"];
    const allowedIndexTypes = ["BTREE", "HASH"];
    const expectedIndexDefinition = {
        attribute: "The name of the attribute (The column name in the database) on which to add the index",
        indexName: "The unique name of the index",
        indexChoice: '"index"|"unique"|"spatial"|"fulltext"',
        type: '"BTREE"|"HASH"',
    };

    const indexProperties = Object.keys(indexDefinition);
    if (!arePrimitiveArraysEqual(indexProperties, Object.keys(expectedIndexDefinition))) {
        printErrorMessage(`Invalid index definition for '${entityName}' (${indexDefinition.indexName})`);
        console.log("Provided: ", indexDefinition);
        console.log("Expected: ", expectedIndexDefinition);
        return false;
    }

    if (!allowedIndexChoices.includes(indexDefinition.indexChoice.toLowerCase())) {
        printErrorMessage(
            `Invalid index choice provided for '${entityName}' (${indexDefinition.indexName}): ${indexDefinition.indexChoice}`,
        );
        console.log("Allowed options: ", allowedIndexChoices.join(", "));
        return false;
    }

    if (!allowedIndexTypes.includes(indexDefinition.type.toUpperCase())) {
        printErrorMessage(`Invalid index type provided for '${entityName}' (${indexName})`);
        console.log("Allowed options: ", allowedIndexChoices.join(", "));
        return false;
    }

    return true;
};

const validateRelationship = (entityName, relationshipName, relationshipAttributes) => {
    if (!Object.keys(dataModel).includes(relationshipName)) {
        printErrorMessage(`Invalid attribute provided for '${entityName}' relationship: '${relationshipName}. 
    This entity does not exist in the data model.`);
        return false;
    }

    if (!Array.isArray(relationshipAttributes)) {
        printErrorMessage(`${entityName} (${relationshipName}) related attributes are not provided as an array`);
        return false;
    }

    return true;
};

// TODO Implement checks
const validateOptions = (entityName, options = {}) => {
    const expectedOptionsDefinition = {
        type: "[MySQL column type]",
        lengthOrValues: "[null|int|if type is enum, then comma separated values '1','2','3',...]",
        default: "[value|null|CURRENT_TIMESTAMP]",
        allowNull: "[true|false]",
    };

    const optionProperties = Object.keys(options);

    if (!arePrimitiveArraysEqual(optionProperties, Object.keys(expectedOptionsDefinition))) {
        printErrorMessage(`Invalid option definition for '${entityName}'`);
        console.log("Provided: ", options);
        console.log("Expected: ", expectedOptionsDefinition);
        return false;
    }

    return true;
};
//#endregion

export const validateDataBaseConfig = (databaseConfig = {}) => {
    if (!databaseConfig) {
        printErrorMessage("No database server configuration provided");
        return false;
    }

    if (!isValidObject(databaseConfig)) {
        printErrorMessage(`Database server configuration not provided as an object`);
        return false;
    }
    const expectedDatabaseConfig = {
        host: "The database server host name",
        user: "The database user name",
        password: "The database user password",
        port: 3306,
        ssl: "true|false",
        modules: [{ moduleName: "main", schemaName: "some_database_schema_name" }],
    };

    const databaseConfigProperties = Object.keys(databaseConfig);
    if (!arePrimitiveArraysEqual(databaseConfigProperties, Object.keys(expectedDatabaseConfig))) {
        printErrorMessage(`Invalid database server configuration provided:`);
        console.log("Provided: ", databaseConfig);
        console.log("Expected: ", expectedDatabaseConfig);
        return false;
    }

    outputFormattedLog("Database server configuration validation passed!", SUB_HEADING_FORMAT);
    return databaseConfig;
};
