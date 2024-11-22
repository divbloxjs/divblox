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
    getEntityAttributes
} from "../_helpers/helpers.server";

/**
 * @typedef { import("@prisma/client").__entityNameSqlCase__ } __entityNamePascalCase__
 * @typedef { import("@prisma/client").Prisma.__entityNameSqlCase__CreateInput } __entityNamePascalCase__CreateInput
 * @typedef { import("@prisma/client").Prisma.__entityNameSqlCase__UpdateInput } __entityNamePascalCase__UpdateInput
 */

/**
 * A point on a two dimensional plane.
 * @typedef {Object} __entityNamePascalCase__Data
 * @property {Object[]} __entityName__Array
 * @property {number} __entityName__TotalCount
 * @property {Object<?string, string[]>} enums
 */

// DX-NOTE: Maximum number of options to load for related entities
const RELATIONSHIP_LOAD_LIMIT = 50;

// DX-NOTE: Configuration for which attributes to search through.
//          This search performs a fuzzy LIKE comparison using wildcards, and as such
//          IGNORES any non-text data types.
const searchConfig = {
    attributes: ["__allAttributesString__"]
    // relationships: {
    //     relatedEntityName: { attributes: [] }
    // }
};

/**
 *
 * @param {Object} constraints
 * @returns {Promise<__entityNamePascalCase__Data>}
 */
export const load__entityNamePascalCase__Array = async (constraints = {}) => {
    const selectClause = getPrismaSelectAllFromEntity("__entityName__");
    const prismaConditions = getPrismaConditions("__entityName__", searchConfig, constraints);

    const __entityName__Array = await prisma.__entityNameSqlCase__.findMany({
        select: selectClause,
        ...prismaConditions
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
 * @param {number} id
 * @return {Promise<{__entityName__: ?__entityNamePascalCase__, relationshipData?: any[], associatedData?: any[]}>}
 */
export const load__entityNamePascalCase__ = async (id, relationshipOptions = true) => {
    const __entityName__ = await prisma.__entityNameSqlCase__.findUnique({
        where: { id: id }
    });

    if (!__entityName__) return { __entityName__: null };

    let returnObject = { __entityName__ };
    if (!relationshipOptions) return returnObject;

    const relationshipData = await get__entityNamePascalCase__RelationshipData();
    returnObject = {
        ...returnObject,
        ...relationshipData
    };

    if (getEntitiesRelatedTo("__entityName__").length === 0) return returnObject;

    const associatedData = await get__entityNamePascalCase__AssociatedData(__entityName__?.id);
    returnObject = {
        ...returnObject,
        ...associatedData
    };

    return returnObject;
};

/**
 * @param {__entityNamePascalCase__CreateInput} data
 * @return {Promise<__entityNamePascalCase__>}
 */
export const create__entityNamePascalCase__ = async (data) => {
    return await prisma.__entityNameSqlCase__.create({ data });
};

/**
 * @param {__entityNamePascalCase__UpdateInput} data
 * @return {Promise<__entityNamePascalCase__>}
 */
export const update__entityNamePascalCase__ = async (data) => {
    await prisma.__entityNameSqlCase__.update({
        data,
        where: { id: data.id }
    });
};

/**
 * @param {number} id
 */
export const delete__entityNamePascalCase__ = async (id) => {
    await prisma.__entityNameSqlCase__.delete({ where: { id } });
};

/**
 * @return {Promise<Object.<?string, any[]>>}
 */
export const get__entityNamePascalCase__RelationshipData = async () => {
    const relationshipData = {};

    __relationshipsOptionsAssignment__;

    return relationshipData;
};

/**
 * @param {number} __entityName__Id
 * @return {Promise<Object.<?string, any[]>>}
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
