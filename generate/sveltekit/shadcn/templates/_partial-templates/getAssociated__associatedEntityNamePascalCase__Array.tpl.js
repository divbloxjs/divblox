/**
 * @return {Promise<any[]>}
 */
const getAssociated__associatedEntityNamePascalCase__Array = async (__relationshipName__) => {
    const __associatedEntityName__Array = await prisma.__associatedEntityNameSqlCase__.findMany({
        where: { __relationshipNameSqlCase__: __relationshipName__ },
        take: RELATIONSHIP_LOAD_LIMIT
    });

    return __associatedEntityName__Array;
};
