// This file is specific to the environment you are deploying to
export default {
    // The Divblox data modeller uses the concept of modules that allows you
    // to create tables grouped into different schemas on the same database server
    modules: [{ moduleName: "main", schemaName: "dxdatabase" }],
    host: "localhost",
    user: "dxuser",
    password: "secret",
    port: 3307,
    ssl: false,
};
