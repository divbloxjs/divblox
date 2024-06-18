import { isNumeric, isValidObject } from "dx-utilities";
import { parse } from "qs";
import {
    convertLowerCaseToCamelCase,
    convertLowerCaseToPascalCase,
    getCamelCaseSplittedToLowerCase,
} from "dx-utilities";
import dxConfig from "../../../../../dx.config";

export const DB_IMPLEMENTATION_TYPES = { SNAKE_CASE: "snakecase", PASCAL_CASE: "pascalcase", CAMEL_CASE: "camelcase" };

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

export const normalizeDatabaseArray = (array = [], removeLastUpdated = true, makeIdInteger = true) => {
    if (!Array.isArray(array)) throw new Error(`${array} is not a valid array`);

    array.forEach((object) => {
        if (!isValidObject(object)) throw new Error(`${object} is not a valid object`);
        normalizeDatabaseObject(object, removeLastUpdated, makeIdInteger);
    });
};

export const normalizeDatabaseObject = (object = {}, removeLastUpdated = true, makeIdInteger = true) => {
    if (!isValidObject(object)) return false;

    Object.keys(object).forEach((keyName) => {
        if (isValidObject(object[keyName])) {
            if (object[`${keyName}Id`]) {
                object[`${keyName}Id`] = parseInt(object[`${keyName}Id`]);
            }

            normalizeDatabaseObject(object[keyName]);
        }

        if (removeLastUpdated && keyName === "lastUpdated") {
            delete object[keyName];
        }

        if (makeIdInteger && keyName === "id") {
            object[keyName] = parseInt(object[keyName]);
        }
    });
};

export const getIntId = (id) => {
    if (!id || id === -1 || id === "-1") {
        return null;
    }

    if (typeof id === "string") {
        return parseInt(id);
    }

    return id;
};

export const getPrismaConditions = (searchConfig = {}, constraints = {}) => {
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
            prismaConditions.where.OR.push({ [attributeName]: { contains: constraints.search } });
        });

        Object.keys(searchConfig.relationships).forEach((entityName) => {
            if (!prismaConditions.where.OR) prismaConditions.where.OR = [];
            const relationshipConstraint = { [entityName]: {} };
            searchConfig.relationships[entityName].attributes.forEach((attributeName) => {
                relationshipConstraint[entityName][attributeName] = { contains: constraints.search };
            });

            prismaConditions.where.OR.push(relationshipConstraint);
        });
    }

    // Recursive through tables [relationship.attribute][lte]=3
    if (constraints.filter) {
        prismaConditions.where = {};
        Object.keys(constraints.filter).forEach((attributeName) => {
            prismaConditions.where[attributeName] = {};
            Object.keys(constraints.filter[attributeName]).forEach((condition) => {
                let prismaCondition = condition;

                if (prismaCondition === "eq") prismaCondition = "equals";
                if (condition === "ne") prismaCondition = "not";
                if (condition === "like") prismaCondition = "contains";

                prismaConditions.where[attributeName][prismaCondition] = constraints.filter[attributeName][condition];
            });
        });
    }

    return prismaConditions;
};

export const getConstraintFromSearchParams = (url) => {
    const urlSearchParams = parse(url.search.substring(1, url.search.length));
    const constraints = {};

    if (urlSearchParams.hasOwnProperty("search")) {
        constraints.search = urlSearchParams.search;
    }

    if (urlSearchParams.hasOwnProperty("limit") && isNumeric(urlSearchParams.limit)) {
        constraints.limit = parseInt(urlSearchParams.limit.toString());
    }

    if (urlSearchParams.hasOwnProperty("offset") && isNumeric(urlSearchParams.offset)) {
        constraints.offset = parseInt(urlSearchParams.offset.toString());
    }

    if (urlSearchParams.hasOwnProperty("sort") && isValidObject(urlSearchParams.sort)) {
        constraints.sort = urlSearchParams.sort;
    }

    if (urlSearchParams.hasOwnProperty("filter") && isValidObject(urlSearchParams.filter)) {
        constraints.filter = urlSearchParams.filter;
    }

    return constraints;
};

export const buildAttributeMap = (tableConfig = {}, orderedAttributeMap = {}, relationshipStack = []) => {
    if (!isValidObject(tableConfig)) return {};

    Object.keys(tableConfig).forEach((keyName) => {
        const isNestedRelationship =
            isValidObject(tableConfig[keyName]) &&
            Object.values(tableConfig[keyName]).every((value) => isValidObject(value));

        if (isNestedRelationship) {
            const innerRelationshipStack = JSON.parse(JSON.stringify(relationshipStack));
            innerRelationshipStack.push(getSqlCase(keyName));

            buildAttributeMap(tableConfig[keyName], orderedAttributeMap, innerRelationshipStack);
            return;
        }

        orderedAttributeMap[tableConfig[keyName].column] = {
            attributeName: getSqlCase(keyName),
            type: tableConfig[keyName]?.type ?? "text",
            stack: [...relationshipStack, getSqlCase(keyName)],
            displayName: tableConfig[keyName].displayName ?? keyName,
        };
    });
};

export const getDeepValue = (obj = undefined, nestedPath = []) => {
    if (!isValidObject(obj)) return obj;

    if (nestedPath.length === 0) return obj;
    const currentProperty = nestedPath.shift();

    return getDeepValue(obj[currentProperty], nestedPath);
};

export const flattenRowObject = (nestedRowData = {}, attributeMap = {}) => {
    if (!isValidObject(nestedRowData)) return [];

    const row = [];
    Object.values(attributeMap).forEach((attributeDef) => {
        row.push({
            value: getDeepValue(nestedRowData, [...attributeDef.stack]),
            type: attributeDef.type,
        });
    });

    return row;
};
