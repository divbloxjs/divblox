// This file is specific to the environment you are deploying to
export default {
    // The Divblox data modeller uses the concept of modules that allows you
    // to create tables grouped into different schemas on the same database server
    modules: [
        { moduleName: "main", schemaName: "dxdatabase" },
        { moduleName: "other", schemaName: "dxdatabase_2" },
    ],
    host: "localhost",
    user: "root",
    password: "secret",
    port: 3308,
    ssl: false,
};
