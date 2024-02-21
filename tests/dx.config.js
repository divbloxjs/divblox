// Every property can be overwritten by node ENV variables of the same name
export default {
    dxApiKey: "my_super_secret_key", // Divblox API key used to access resources stored there
    environment: "local", // Current environment,
    dataModelPath: "tests/org-data-model.json", // Path from route to the data model JSON file
    databaseConfigPath: "tests/database.config.js", // Path from root to the database configuration file
    databaseCaseImplementation: "pascalcase", // Path from root to the database configuration file
};
