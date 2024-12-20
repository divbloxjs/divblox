import { outputFormattedLog, printErrorMessage, printInfoMessage } from "dx-cli-tools/helpers.js";
import { isValidObject, arePrimitiveArraysEqual } from "dx-utilities";
import { DB_IMPLEMENTATION_TYPES, SUB_HEADING_FORMAT } from "../constants.js";
import { getSqlFromCamelCase } from "./sqlCaseHelpers.js";

export const validateDataModel = (dataModelToCheck = {}) => {
    if (!dataModelToCheck) {
        printErrorMessage("No data model provided");
        return false;
    }

    if (!isValidObject(dataModelToCheck)) {
        printErrorMessage("Data model is not a valid object");
        return false;
    }

    for (const [entityNameToCheck, entityDefinitionToCheck] of Object.entries(dataModelToCheck)) {
        if (containsWhiteSpace(entityNameToCheck)) {
            printErrorMessage(
                `Entity name '${entityNameToCheck}' contains white spaces. Please make sure that the data model is configured in camelCase.`,
            );
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

        for (const [attributeName, attributeDefinition] of Object.entries(entityDefinitionToCheck.attributes)) {
            const isValidAttribute = validateAttribute(entityNameToCheck, attributeName, attributeDefinition);
            if (!isValidAttribute) return false;
        }

        if (!Array.isArray(entityDefinitionToCheck.indexes)) {
            printErrorMessage(`${entityNameToCheck} indexes are not provided as an array`);
            return false;
        }

        for (const indexDefinition of entityDefinitionToCheck.indexes) {
            const isValidIndex = validateIndex(entityNameToCheck, indexDefinition);
            if (!isValidIndex) return false;
        }

        if (!isValidObject(entityDefinitionToCheck.relationships)) {
            printErrorMessage(`${entityNameToCheck} relationships are not provided as an object`);
            return false;
        }

        const allRelationshipAttributeNames = [];
        for (const [relationshipName, relationshipAttributes] of Object.entries(
            entityDefinitionToCheck.relationships,
        )) {
            allRelationshipAttributeNames.push(...relationshipAttributes);
            const isValidRelationship = validateRelationship(
                entityNameToCheck,
                relationshipName,
                relationshipAttributes,
                dataModelToCheck,
            );

            if (!isValidRelationship) return false;
        }

        if (new Set(allRelationshipAttributeNames).size !== allRelationshipAttributeNames.length) {
            printErrorMessage(`Error creating relationships for entity '${entityNameToCheck}'.`);
            printInfoMessage(
                `Related attributes names can not duplicate.
    Provided: ${allRelationshipAttributeNames.join(", ")}`,
                SUB_HEADING_FORMAT,
            );
            return false;
        }

        if (!isValidObject(entityDefinitionToCheck.options)) {
            printErrorMessage(`${entityNameToCheck} options are not provided as an object`);
            return false;
        }

        // validateOptions();
    }

    outputFormattedLog("Initial data model validation passed!", SUB_HEADING_FORMAT);
    return dataModelToCheck;
};

export const getCasedDataModel = (dataModel = {}, databaseCaseImplementation = DB_IMPLEMENTATION_TYPES.SNAKE_CASE) => {
    const casedDataModel = {};

    for (const [entityNameToCheck, entityDefinitionToCheck] of Object.entries(dataModel)) {
        const entityNameCased = getSqlFromCamelCase(entityNameToCheck, databaseCaseImplementation);

        const entityDefinitionCased = {
            attributes: [],
            indexes: [],
            relationships: {},
            options: entityDefinitionToCheck.options,
        };

        for (const [attributeName, attributeDefinition] of Object.entries(entityDefinitionToCheck.attributes)) {
            entityDefinitionCased.attributes[getSqlFromCamelCase(attributeName, databaseCaseImplementation)] =
                attributeDefinition;
        }

        for (const indexDefinition of entityDefinitionToCheck.indexes) {
            indexDefinition.attribute = getSqlFromCamelCase(indexDefinition.attribute, databaseCaseImplementation);
            entityDefinitionCased.indexes.push(indexDefinition);
        }

        for (const [relationshipName, relationshipAttributes] of Object.entries(
            entityDefinitionToCheck.relationships,
        )) {
            entityDefinitionCased.relationships[getSqlFromCamelCase(relationshipName, databaseCaseImplementation)] =
                relationshipAttributes.map((attribute) => getSqlFromCamelCase(attribute, databaseCaseImplementation));
        }

        casedDataModel[entityNameCased] = entityDefinitionCased;
    }

    return casedDataModel;
};

//#region Data Model Validation Helpers
const validateAttribute = (entityName, attributeName, attributeDefinition = {}) => {
    if (containsWhiteSpace(attributeName)) {
        printErrorMessage(
            `'${entityName}' entity attribute: '${attributeName}' contains white spaces. Please make sure that the data model is configured in camelCase.`,
        );
        return false;
    }

    const expectedAttributeDefinition = {
        name: "[column name]",
        type: "[MySQL column type]",
        lengthOrValues: "[null|int|if type is enum, then comma separated values '1','2','3',...]",
        default: "[value|null|CURRENT_TIMESTAMP]",
        allowNull: "[true|false]",
    };

    if (!attributeDefinition.hasOwnProperty("allowNull")) {
        attributeDefinition.allowNull = true;
    }

    if (!attributeDefinition.hasOwnProperty("default")) {
        attributeDefinition.default = undefined;
    }

    if (!attributeDefinition.hasOwnProperty("lengthOrValues")) {
        attributeDefinition.lengthOrValues = undefined;
    }

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

const validateRelationship = (entityName, relatedEntityName, uniqueRelationshipNames, fullDataModel) => {
    if (containsWhiteSpace(relatedEntityName)) {
        printErrorMessage(
            `${entityName} relationship: '${relatedEntityName}' contains white spaces. Please make sure that the data model is configured in camelCase.`,
        );
        return false;
    }

    if (!Object.keys(fullDataModel).includes(relatedEntityName)) {
        printErrorMessage(`Invalid attribute provided for '${entityName}' relationship: '${relatedEntityName}. 
    This entity does not exist in the data model.`);
        return false;
    }

    if (!Array.isArray(uniqueRelationshipNames)) {
        printErrorMessage(`${entityName} (${relatedEntityName}) related attributes are not provided as an array`);
        return false;
    }

    if (new Set(uniqueRelationshipNames).size !== uniqueRelationshipNames.length) {
        printErrorMessage(`Error creating relationships for entity '${entityName}'.`);
        printInfoMessage(
            `Related attributes names can not duplicate.
Provided: ${uniqueRelationshipNames.join(", ")}`,
            SUB_HEADING_FORMAT,
        );
        return false;
    }

    for (const relationshipName of uniqueRelationshipNames) {
        if (containsWhiteSpace(relationshipName)) {
            printErrorMessage(
                `${entityName} relationship: '${relationshipName}' contains white spaces. Please make sure that the data model is configured in camelCase.`,
            );
            return false;
        }
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

const containsWhiteSpace = (string = "") => {
    return /\s/.test(string);
};
