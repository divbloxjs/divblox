// Multiple environment configuration is catered for by having different version of this file per git branch,
// or by overwriting the properties using node ENV variables
export default {
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
