// Every property can be overwritten by node ENV variables of the same name
export default {
    dxApiKey: "my_super_secret_key", // Divblox API key used to access resources stored there
    environment: "local", // Current environment,
    dataModelPath: "tests/data-model-v0.0.7.json", // Path from route to the data model JSON file
    databaseConfigPath: "tests/database.config.js", // Path from root to the database configuration file
    databaseCaseImplementation: "snakecase", // Path from root to the database configuration file
};
