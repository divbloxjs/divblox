import dataModel from "datamodel";
import {
    isEmptyObject,
    getCamelCaseSplittedToLowerCase,
    convertLowerCaseToPascalCase,
    convertLowerCaseToCamelCase,
    isNumeric,
} from "dx-utilities";
import dxConfig from "../../../dx.config";
import { getEntityAttributes, getEnumOptions } from "$components/data-model/_helpers/helpers.server";
import { getCamelFromSqlCase, getSqlFromCamelCase } from "$lib/helpers";

export const getPrismaSelectAllFromEntity = (entityName, select = {}) => {
    if (isEmptyObject(select)) select.id = true;

    // Add all attributes
    Object.keys(dataModel[entityName].attributes).forEach((attributeName) => {
        select[getSqlFromCamelCase(attributeName)] = true;
    });

    // Nested add all relationships

    for (const [relatedEntity, relationshipNames] of Object.entries(dataModel[entityName].relationships)) {
        select[getSqlFromCamelCase(relatedEntity)] = { select: {} };

        getPrismaSelectAllFromEntity(relatedEntity, select[getSqlFromCamelCase(relatedEntity)].select);
    }

    return select;
};

export const getPrismaConditions = (entityName = "", searchConfig = {}, constraints = {}) => {
    const prismaConditions = {};

    if (constraints.limit) {
        prismaConditions.take = constraints.limit;
    }

    if (constraints.offset) {
        prismaConditions.skip = constraints.offset;
    }

    if (constraints.sort) {
        prismaConditions.orderBy = [];
        Object.keys(constraints.sort).forEach((attributeName) => {
            const obj = {};
            obj[attributeName] = constraints.sort[attributeName];
            prismaConditions.orderBy.push(obj);
        });
    }

    if (constraints.search) {
        if (constraints.search[entityName]) {
            constraints.search = { ...constraints.search, ...constraints.search[entityName] };
            delete constraints.search[entityName];
        }
        if (!prismaConditions.where) prismaConditions.where = {};

        const attributes = getEntityAttributes(entityName);
        let searchValue = constraints.search;
        searchConfig.attributes.forEach((attributeName) => {
            if (!Object.keys(attributes).includes(attributeName)) {
                console.error("Invalid search attribute provided: ", attributeName);
                return;
            }

            if (!prismaConditions.where.OR) prismaConditions.where.OR = [];

            if (
                attributes[attributeName].type.toLowerCase() === "date" ||
                attributes[attributeName].type.toLowerCase() === "datetime"
            ) {
                console.error("Date/Datetime attributes are forcefully removed from search condition: ", attributeName);
                return;
            }

            if (attributes[attributeName].type.toLowerCase() === "json") {
                console.error("JSON attributes are forcefully removed from search condition: ", attributeName);
                return;
            }

            let comparisonOperation = "contains"; // For string attributes

            if (attributes[attributeName].type.toLowerCase() === "enum") {
                if (!getEnumOptions(entityName, attributeName, false).includes(searchValue)) {
                    console.error("Invalid enum options are forcefully removed from search condition: ", attributeName);
                    return;
                } else {
                    comparisonOperation = "equals";
                }
            }

            if (
                attributes[attributeName].type.toLowerCase().includes("int") ||
                attributes[attributeName].type.toLowerCase() === "double" ||
                attributes[attributeName].type.toLowerCase() === "float"
            ) {
                if (!isNumeric(constraints.search)) {
                    console.error(
                        "Numeric attributes are forcefully removed from search condition which is not numeric: ",
                        attributeName,
                    );
                    return;
                }

                // For numeric attributes
                comparisonOperation = "equals";
                searchValue = Number(constraints.search);
            }

            prismaConditions.where.OR.push({
                [getSqlFromCamelCase(attributeName)]: { [comparisonOperation]: searchValue },
            });
        });

        Object.keys(searchConfig.relationships ?? []).forEach((entityName) => {
            const relationshipAttributes = getEntityAttributes(entityName);
            if (!prismaConditions.where.OR) prismaConditions.where.OR = [];

            const relationshipConstraint = { [getSqlFromCamelCase(entityName)]: {} };

            searchConfig.relationships[entityName].attributes.forEach((attributeName) => {
                if (
                    relationshipAttributes[attributeName].type.toLowerCase() === "date" ||
                    relationshipAttributes[attributeName].type.toLowerCase() === "datetime"
                ) {
                    console.error(
                        "Date/Datetime attributes are forcefully removed from search condition: ",
                        attributeName,
                    );
                    return;
                }

                if (relationshipAttributes[attributeName].type.toLowerCase() === "json") {
                    console.error("JSON attributes are forcefully removed from search condition: ", attributeName);
                    return;
                }

                let comparisonOperation = "contains"; // For string attributes
                if (
                    relationshipAttributes[attributeName].type.toLowerCase().includes("int") ||
                    relationshipAttributes[attributeName].type.toLowerCase() === "double" ||
                    relationshipAttributes[attributeName].type.toLowerCase() === "float"
                ) {
                    if (!isNumeric(constraints.search)) {
                        console.error(
                            "Numeric attributes are forcefully removed from search condition which is not numeric: ",
                            attributeName,
                        );
                        return;
                    }

                    // For numeric attributes
                    comparisonOperation = "equals";
                    searchValue = Number(constraints.search);
                }

                relationshipConstraint[getSqlFromCamelCase(entityName)][getSqlFromCamelCase(attributeName)] = {
                    [comparisonOperation]: searchValue,
                };
            });

            prismaConditions.where.OR.push(relationshipConstraint);
        });
    }

    if (constraints.filter) {
        if (!prismaConditions.where) prismaConditions.where = {};

        convertFilterClauseToPrismaClause(
            constraints.filter,
            prismaConditions.where,
            getSqlFromCamelCase(entityName),
            getSqlFromCamelCase(entityName),
        );
    }

    return prismaConditions;
};

const convertFilterClauseToPrismaClause = (
    filterConstraint = {},
    prismaFilterConditions = {},
    baseEntityName,
    currentEntityName,
) => {
    Object.keys(filterConstraint).forEach((entityName) => {
        // Related entities are nested

        const depth = getObjectDepth(filterConstraint[entityName]);
        if (depth > 1) {
            console.log("DEPTH BIG");
            console.log("baseEntityName", baseEntityName);
            console.log("entityName", entityName);
            // Nested relationship

            if (entityName !== baseEntityName) {
                prismaFilterConditions[entityName] = {};
                convertFilterClauseToPrismaClause(
                    filterConstraint[entityName],
                    prismaFilterConditions[entityName],
                    getCamelFromSqlCase(baseEntityName),
                    getCamelFromSqlCase(entityName),
                );
            } else {
                console.log("1");

                convertFilterClauseToPrismaClause(
                    filterConstraint[entityName],
                    prismaFilterConditions,
                    getCamelFromSqlCase(baseEntityName),
                    getCamelFromSqlCase(entityName),
                );
            }

            return;
        }

        // If at last layer of object - the key is the related entity's attribute
        const attributeName = entityName;
        const attributes = getEntityAttributes(currentEntityName, true);

        Object.keys(filterConstraint[attributeName]).forEach((condition) => {
            let filterValue = filterConstraint[attributeName][condition];

            let prismaCondition = condition;

            if (condition === "eq") prismaCondition = "equals";
            if (condition === "ne") prismaCondition = "not";
            if (condition === "like") prismaCondition = "contains";

            if (
                attributes[attributeName].type.toLowerCase() === "date" ||
                attributes[attributeName].type.toLowerCase() === "datetime"
            ) {
                filterValue = new Date(filterValue);
            }

            if (attributes[attributeName].type.toLowerCase() === "json") {
                console.error("JSON attributes are forcefully removed from search condition: ", attributeName);
                return;
            }

            if (attributes[attributeName].type.toLowerCase() === "enum") {
                if (!getEnumOptions(currentEntityName, attributeName, false).includes(filterValue)) {
                    console.error("Invalid enum options are forcefully removed from search condition: ", attributeName);
                    return;
                } else {
                    prismaCondition = "equals";
                }
            }

            if (
                attributes[attributeName].type.toLowerCase().includes("int") ||
                attributes[attributeName].type.toLowerCase() === "double" ||
                attributes[attributeName].type.toLowerCase() === "float"
            ) {
                if (!isNumeric(filterValue)) {
                    console.error(
                        "Numeric attributes are forcefully removed from search condition which is not numeric: ",
                        attributeName,
                    );
                    return;
                }

                // For numeric attributes
                prismaCondition = "equals";
                filterValue = Number(filterValue);
            }

            if (!prismaFilterConditions[attributeName]) prismaFilterConditions[attributeName] = {};

            console.log("attributeName", attributeName);
            console.log("prismaCondition", prismaCondition);
            console.log("filterValue", filterValue);
            prismaFilterConditions[attributeName][prismaCondition] = filterValue;
            console.log("prismaFilterConditions", prismaFilterConditions);
        });
    });
};

/**
 * Returns the integer value of the depth of the provided object
 * @param {Object} objectToCheck NOTE: Recursive object will BREAK
 * TODO: Add to dx-utilities
 * @returns {number}
 */
const getObjectDepth = (objectToCheck) => {
    return Object(objectToCheck) === objectToCheck
        ? 1 + Math.max(-1, ...Object.values(objectToCheck).map(getObjectDepth))
        : 0;
};
