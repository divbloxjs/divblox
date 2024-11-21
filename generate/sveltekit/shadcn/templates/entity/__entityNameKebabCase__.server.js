import { prisma } from "$lib/server/prisma-instance";
import { isNumeric } from "dx-utilities";
import { getPrismaSelectAllFromEntity, getPrismaConditions } from "$lib/server/prisma.helpers";
import { getSqlFromCamelCase } from "$lib/helpers";
import { formatISO } from "date-fns/formatISO";
import { format } from "date-fns";

import { normalizeDatabaseArray } from "../_helpers/helpers";
import {
    getEntitiesRelatedTo,
    getRelatedEntities,
    getEntityAttributeUiTypes,
    getRelationships,
    getAllEnumOptions,
    getEntityAttributes,
} from "../_helpers/helpers.server";

// DX-NOTE: Maximum number of options to load for related entities
const RELATIONSHIP_LOAD_LIMIT = 50;

// DX-NOTE: Configuration for which attributes to search through.
//          This search performs a fuzzy LIKE comparison using wildcards, and as such
//          IGNORES any non-text data types.
const searchConfig = {
    attributes: ["__allAttributesString__"],
    // relationships: {
    //     relatedEntityName: { attributes: [] }
    // }
};

/**
 * Function to return an __entityName__Array.
 * Handles building search, filter and sort conditions as well as a default select statement
 *
 * @param {Object} constraints
 * @returns {Promise<Object>}
 */
export const load__entityNamePascalCase__Array = async (constraints = {}) => {
    const selectClause = getPrismaSelectAllFromEntity("__entityName__");
    const prismaConditions = getPrismaConditions("__entityName__", searchConfig, constraints);

    const __entityName__Array = await prisma.__entityNameSqlCase__.findMany({
        select: selectClause,
        ...prismaConditions,
    });

    normalizeDatabaseArray(__entityName__Array);

    const totalCountConstraints = { search: constraints.search, filter: constraints.filter };
    const totalCountPrismaConditions = getPrismaConditions("__entityName__", searchConfig, totalCountConstraints);
    const __entityName__TotalCount = await prisma.__entityNameSqlCase__.count({ ...totalCountPrismaConditions });

    const enums = {};
    getAllEnumOptions("__entityName__", enums);

    return { __entityName__Array, __entityName__TotalCount, enums };
};

/**
 * Returns a single instance of __entityNamePascalCase__ by Id, as well as related data if specified
 * @param {*} id Entity ID to retrieve
 * @param {*} relationshipOptions Whether to return a list of relationship options as well
 * @returns {Promise<Object>}
 */
export const load__entityNamePascalCase__ = async (id = -1, relationshipOptions = true) => {
    const __entityName__ = await prisma.__entityNameSqlCase__.findUnique({
        where: { id: id },
    });

    if (!__entityName__) return { __entityName__: null };

    const attributeNameTypeMap = getEntityAttributeUiTypes("__entityName__");
    const attributes = getEntityAttributes("__entityName__", true);

    for (const [key, val] of Object.entries(__entityName__)) {
        if (val && attributeNameTypeMap[key] === "date") {
            __entityName__[key] = formatISO(val, { representation: "date" });
        }

        if (val && attributeNameTypeMap[key] === "datetime-local") {
            __entityName__[key] = format(val, "yyyy-MM-dd'T'hh:mm");
        }

        if (val && attributes[key]?.type?.toLowerCase() === "decimal") {
            __entityName__[key] = parseFloat(val?.toString());
        }
    }

    for (const [relatedEntityName, relationshipNames] of Object.entries(getRelationships("__entityName__"))) {
        for (const relationshipName of relationshipNames) {
            __entityName__[getSqlFromCamelCase(relationshipName)] =
                __entityName__[getSqlFromCamelCase(relationshipName)]?.toString();
        }
    }

    let returnObject = { __entityName__ };
    if (!relationshipOptions) return returnObject;

    const relationshipData = await get__entityNamePascalCase__RelationshipData();
    returnObject = {
        ...returnObject,
        ...relationshipData,
    };

    if (getEntitiesRelatedTo("__entityName__").length === 0) return returnObject;

    const associatedData = await get__entityNamePascalCase__AssociatedData(__entityName__?.id);
    returnObject = {
        ...returnObject,
        ...associatedData,
    };

    return returnObject;
};

/**
 * Formats the data objects and deals with creating an instance of __entityNamePascalCase__
 * @param {Object} data
 */
export const create__entityNamePascalCase__ = async (data) => {
    const relationships = getRelatedEntities("__entityName__");
    const attributeNameTypeMap = getEntityAttributeUiTypes("__entityName__");

    for (const [key, val] of Object.entries(data)) {
        if (attributeNameTypeMap[key] === "date" || attributeNameTypeMap[key] === "datetime-local") {
            data[key] = new Date(val);
        }
    }

    Object.values(relationships).forEach((relationshipNames) => {
        relationshipNames.forEach((relationshipName) => {
            relationshipName = getSqlFromCamelCase(relationshipName);
            if (data.hasOwnProperty(relationshipName)) {
                if (!isNumeric(data[relationshipName])) {
                    delete data[relationshipName];
                    console.error(
                        `Removed non-numeric relationship '${relationshipName}' value: ${data[relationshipName]}`,
                    );
                }

                if (typeof data[relationshipName] === "string") {
                    data[relationshipName] = parseInt(data[relationshipName]);
                }
            } else {
                data[relationshipName] = null;
            }
        });
    });

    await prisma.__entityNameSqlCase__.create({ data });
};

/**
 * Formats the data objects and deals with updating an instance of __entityNamePascalCase__ by Id
 * @param {Object} data
 */
export const update__entityNamePascalCase__ = async (data) => {
    const relationships = getRelatedEntities("__entityName__");
    const attributeNameTypeMap = getEntityAttributeUiTypes("__entityName__");

    for (const [key, val] of Object.entries(data)) {
        if (attributeNameTypeMap[key] === "date" || attributeNameTypeMap[key] === "datetime-local") {
            data[key] = new Date(val);
        }
    }

    Object.values(relationships).forEach((relationshipNames) => {
        relationshipNames.forEach((relationshipName) => {
            relationshipName = getSqlFromCamelCase(relationshipName);
            if (data.hasOwnProperty(relationshipName)) {
                if (!isNumeric(data[relationshipName])) {
                    delete data[relationshipName];
                    console.error(
                        `Removed non-numeric relationship '${relationshipName}' value: ${data[relationshipName]}`,
                    );
                }

                if (typeof data[relationshipName] === "string") {
                    data[relationshipName] = parseInt(data[relationshipName]);
                }
            } else {
                data[relationshipName] = null;
            }
        });
    });

    await prisma.__entityNameSqlCase__.update({
        data,
        where: { id: data.id },
    });
};

/**
 * Deals with deleting an instance of Organisation by Id
 * @param {number} id The Id to query on
 */
export const delete__entityNamePascalCase__ = async (id = -1) => {
    await prisma.__entityNameSqlCase__.delete({ where: { id } });
};

/**
 * Returns a list of entries for each __entityNamePascalCase__ relationship
 * Most commonly used for building dropdowns for the relationship
 * @returns {Promise<Object>}
 */
export const get__entityNamePascalCase__RelationshipData = async () => {
    const relationshipData = {};

    __relationshipsOptionsAssignment__;

    return relationshipData;
};

/**
 * Returns a list of entries for each entity that is associated with __entityNamePascalCase__
 * Most commonly used for displaying associated data for the given __entityNamePascalCase__ Id
 * @param {*} __relationshipName__
 * @returns {Promise<Object>}
 */
export const get__entityNamePascalCase__AssociatedData = async (__entityName__Id) => {
    const associatedData = {};

    __associatedEntitiesAssignment__;

    return associatedData;
};

//#region RelatedEntity / AssociatedEntity Helpers

__getRelatedEntityOptionsFunctionDeclarations__;
__getAssociatedEntityArrayFunctionDeclarations__;

//#endregion RelatedEntity / AssociatedEntity Helpers
