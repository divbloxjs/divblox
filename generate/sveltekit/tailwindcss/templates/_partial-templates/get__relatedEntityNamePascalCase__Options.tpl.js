const get__relatedEntityNamePascalCase__Options = async () => {
    const __relatedEntityName__Array = await prisma.__relatedEntityNameSqlCase__.findMany({
        take: RELATIONSHIP_LOAD_LIMIT,
    });

    const __relatedEntityName__Options = __relatedEntityName__Array.map((__relatedEntityName__) => {
        __relatedEntityName__.id = __relatedEntityName__.id.toString();
        return __relatedEntityName__;
    });

    return __relatedEntityName__Options;
};
