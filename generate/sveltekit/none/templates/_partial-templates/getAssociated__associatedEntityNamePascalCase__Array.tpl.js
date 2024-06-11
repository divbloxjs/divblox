const getAssociated__associatedEntityNamePascalCase__Array = async (__entityName__Id) => {
    const __associatedEntityName__Array = await prisma.__associatedEntityName__.findMany({
        where: { __entityName__Id: __entityName__Id },
        take: RELATIONSHIP_LOAD_LIMIT,
    });

    return __associatedEntityName__Array;
};
