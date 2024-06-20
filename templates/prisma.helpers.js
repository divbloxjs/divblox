import dataModel from "datamodel";
import {
    isEmptyObject,
    getCamelCaseSplittedToLowerCase,
    convertLowerCaseToPascalCase,
    convertLowerCaseToCamelCase,
} from "dx-utilities";
import dxConfig from "../../../dx.config";

export const getPrismaSelectAllFromEntity = (entityName, select = {}) => {
    if (isEmptyObject(select)) select.id = true;

    // Add all attributes
    Object.keys(dataModel[entityName].attributes).forEach((attributeName) => {
        select[getSqlCase(attributeName)] = true;
    });

    // Nested add all relationships

    for (const [relatedEntity, relationshipNames] of Object.entries(dataModel[entityName].relationships)) {
        select[getSqlCase(relatedEntity)] = { select: {} };

        getPrismaSelectAllFromEntity(relatedEntity, select[getSqlCase(relatedEntity)].select);
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
        if (!prismaConditions.where) prismaConditions.where = {};

        searchConfig.attributes.forEach((attributeName) => {
            if (!prismaConditions.where.OR) prismaConditions.where.OR = [];
            prismaConditions.where.OR.push({ [getSqlCase(attributeName)]: { contains: constraints.search } });
        });

        Object.keys(searchConfig.relationships ?? []).forEach((entityName) => {
            if (!prismaConditions.where.OR) prismaConditions.where.OR = [];
            const relationshipConstraint = { [getSqlCase(entityName)]: {} };
            searchConfig.relationships[entityName].attributes.forEach((attributeName) => {
                relationshipConstraint[getSqlCase(entityName)][getSqlCase(attributeName)] = {
                    contains: constraints.search,
                };
            });

            prismaConditions.where.OR.push(relationshipConstraint);
        });
    }

    if (constraints.filter) {
        prismaConditions.where = {};
        convertFilterClauseToPrismaClause(constraints.filter, prismaConditions.where);
    }

    return prismaConditions;
};

const convertFilterClauseToPrismaClause = (filterConstraint = {}, prismaFilterConditions = {}) => {
    Object.keys(filterConstraint).forEach((filterValue) => {
        prismaFilterConditions[filterValue] = {};

        const depth = getObjectDepth(filterConstraint[filterValue]);
        if (depth > 1) {
            // Nested relationship
            convertFilterClauseToPrismaClause(
                filterConstraint[filterValue],
                prismaFilterConditions[filterValue],
                filterValue,
            );
            return;
        }

        Object.keys(filterConstraint[filterValue]).forEach((condition) => {
            let prismaCondition = condition;

            if (condition === "eq") prismaCondition = "equals";
            if (condition === "ne") prismaCondition = "not";
            if (condition === "like") prismaCondition = "contains";

            prismaFilterConditions[filterValue][prismaCondition] = filterConstraint[filterValue][condition];
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

export const getSqlCase = (inputString = "", databaseCaseImplementation = dxConfig.databaseCaseImplementation) => {
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

export const DB_IMPLEMENTATION_TYPES = { SNAKE_CASE: "snakecase", PASCAL_CASE: "pascalcase", CAMEL_CASE: "camelcase" };
