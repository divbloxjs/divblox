import { prisma } from "$lib/server/prisma-instance";
import { isNumeric } from "dx-utilities";
import { getPrismaSelectAllFromEntity, getPrismaConditions, getSqlCase } from "$lib/server/prisma.helpers";
import { formatISO } from "date-fns/formatISO";
import { format } from "date-fns";

import { getIntId, normalizeDatabaseArray } from "../_helpers/helpers";
import {
    getEntitiesRelatedTo,
    getRelatedEntities,
    getEntityAttributeUiTypes,
    getRelationships,
    getAllEnumOptions,
} from "../_helpers/helpers.server";

// DX-NOTE: Maximum number of options to load for related entities
const RELATIONSHIP_LOAD_LIMIT = 50;

// DX-NOTE: Configuration for which attributes to search through
const searchConfig = {
    attributes: ["__allAttributesString__"],
    // relationships: {
    //     relatedEntityName: { attributes: [] }
    // }
};

export const load__entityNamePascalCase__Array = async (constraints = {}) => {
    const selectClause = getPrismaSelectAllFromEntity("__entityName__");
    const prismaConditions = getPrismaConditions("__entityName__", searchConfig, constraints);

    const __entityName__Array = await prisma.__entityNameSqlCase__.findMany({
        select: selectClause,
        ...prismaConditions,
    });

    normalizeDatabaseArray(__entityName__Array);

    const totalCountConstraints = { ...constraints.search, ...constraints.filter };
    const totalCountPrismaConditions = getPrismaConditions("__entityName__", searchConfig, totalCountConstraints);
    const __entityName__TotalCount = await prisma.__entityNameSqlCase__.count({ ...totalCountPrismaConditions });

    const enums = {};
    getAllEnumOptions("organisation", enums);

    return { __entityName__Array, __entityName__TotalCount, enums };
};

export const load__entityNamePascalCase__ = async (id = -1, relationshipOptions = true) => {
    const __entityName__ = await prisma.__entityNameSqlCase__.findUnique({
        where: { id: id },
    });

    __entityName__.id = __entityName__.id.toString();

    const attributeNameTypeMap = getEntityAttributeUiTypes("__entityName__");

    for (const [key, val] of Object.entries(__entityName__)) {
        if (val && attributeNameTypeMap[key] === "date") {
            __entityName__[key] = formatISO(val, { representation: "date" });
        }

        if (val && attributeNameTypeMap[key] === "datetime-local") {
            __entityName__[key] = format(val, "yyyy-MM-dd'T'hh:mm");
        }
    }

    for (const [relatedEntityName, relationshipNames] of Object.entries(getRelationships("__entityName__"))) {
        for (const relationshipName of relationshipNames) {
            __entityName__[getSqlCase(relationshipName)] = __entityName__[getSqlCase(relationshipName)]?.toString();
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
            relationshipName = getSqlCase(relationshipName);
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
            relationshipName = getSqlCase(relationshipName);
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

export const delete__entityNamePascalCase__ = async (id = -1) => {
    await prisma.__entityNameSqlCase__.delete({ where: { id } });
};

export const get__entityNamePascalCase__RelationshipData = async () => {
    const relationshipData = {};

    __relationshipsOptionsAssignment__;

    return relationshipData;
};

export const get__entityNamePascalCase__AssociatedData = async (__entityName__Id) => {
    const associatedData = {};

    __associatedEntitiesAssignment__;

    return associatedData;
};

//#region RelatedEntity / AssociatedEntity Helpers

__getRelatedEntityOptionsFunctionDeclarations__;
__getAssociatedEntityArrayFunctionDeclarations__;

//#endregion RelatedEntity / AssociatedEntity Helpers
