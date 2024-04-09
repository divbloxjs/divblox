import { prisma } from "$lib/server/prisma-instance";
import { isNumeric } from "dx-utilities";
import { getIntId, normalizeDatabaseArray } from "../_helpers/helpers";
import { getEntitiesRelatedTo, getRelatedEntities } from "../_helpers/helpers.server";
import { getPrismaSelectAllFromEntity, getPrismaConditions } from "$lib/server/prisma.helpers";

const RELATIONSHIP_LOAD_LIMIT = 50;

//TODO Recursive
const searchConfig = {
    attributes: ["__entityName__Name"],
    relationships: {
        parent__entityNamePascalCase__: { attributes: ["__entityName__Name"] },
    },
};

// GENERATE entire thing based on data model - fully exhaustive
export const load__entityNamePascalCase__Array = async (constraints = {}) => {
    const selectClause = getPrismaSelectAllFromEntity("__entityName__");
    const prismaConditions = getPrismaConditions("__entityName__", searchConfig, constraints);

    const __entityName__Array = await prisma.__entityName__.findMany({
        // relationLoadStrategy: 'join', // or "query"
        select: selectClause,
        ...prismaConditions,
    });

    try {
        normalizeDatabaseArray(__entityName__Array);
    } catch (err) {
        console.error(err);
    }

    return { __entityName__Array };
};

export const create__entityNamePascalCase__ = async (data) => {
    data.isDefault = parseInt(data.isDefault);

    try {
        await prisma.__entityName__.create({ data });
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
};

export const update__entityNamePascalCase__ = async (data) => {
    const relationships = getRelatedEntities("__entityName__");

    Object.values(relationships).forEach((relationshipName) => {
        if (data.hasOwnProperty(relationshipName)) {
            if (!isNumeric(data[relationshipName])) {
                delete data[relationshipName];
            } else {
                data[relationshipName] = null;
            }
        }
    });

    data.isDefault = parseInt(data.isDefault);

    try {
        const result = await prisma.__entityName__.update({
            data,
            where: { id: data.id },
        });
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
};

export const delete__entityNamePascalCase__ = async (id = -1) => {
    try {
        await prisma.__entityName__.delete({ where: { id } });
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
};

export const load__entityNamePascalCase__ = async (id = -1, relationshipOptions = true) => {
    let __entityName__ = await prisma.__entityName__.findUnique({
        where: { id: id },
    });

    __entityName__ = {
        ...__entityName__,
        id: getIntId(__entityName__.id),
        placeId: getIntId(__entityName__.placeId),
        parent__entityNamePascalCase__Id: getIntId(__entityName__.parent__entityNamePascalCase__Id),
    };

    const returnObject = { __entityName__ };
    if (!relationshipOptions) return returnObject;

    for (const [relatedEntityName, relationshipNames] of Object.entries(getRelatedEntities("__entityName__"))) {
        const relationshipData = await prisma[relatedEntityName].findMany({
            take: RELATIONSHIP_LOAD_LIMIT,
        });

        returnObject[`${relatedEntityName}Options`] = relationshipData.map((relationship) => {
            relationship.id = relationship.id.toString();
            return relationship;
        });
    }

    for (const entityName of getEntitiesRelatedTo("__entityName__")) {
        if (!returnObject?.associatedEntities) {
            returnObject.associatedEntities = {};
        }

        const relationshipData = await prisma[entityName].findMany({
            where: { __entityName__Id: id },
            take: RELATIONSHIP_LOAD_LIMIT,
        });

        returnObject.associatedEntities[entityName] = relationshipData.map((relationship) => {
            relationship.id = relationship.id.toString();
            return relationship;
        });
    }

    return returnObject;
};
