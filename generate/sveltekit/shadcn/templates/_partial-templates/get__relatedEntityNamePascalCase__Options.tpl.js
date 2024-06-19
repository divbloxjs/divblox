const get__relationshipNamePascalCase__Options = async () => {
    const __relationshipName__Array = await prisma.__relatedEntityNameSqlCase__.findMany({
        take: RELATIONSHIP_LOAD_LIMIT,
    });

    const __relationshipName__Options = __relationshipName__Array.map((__relationshipNameSqlCase__) => {
        __relationshipNameSqlCase__.id = __relationshipNameSqlCase__.id.toString();
        return __relationshipNameSqlCase__;
    });

    return __relationshipName__Options;
};
