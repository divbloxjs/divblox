import { getConfig } from "../index.js";
import { syncDatabase } from "../sync/index.js";

const configOptions = await getConfig("tests/dx.config.js");

let moduleConnections = {};

await syncDatabase(configOptions, true);

for (const { moduleName, schemaName } of configOptions.databaseConfig.modules) {
    const casedModuleName = getCaseNormalizedString(moduleName, databaseCaseImplementation);
    try {
        const connectionConfig = {
            host: databaseConfig.host,
            user: databaseConfig.user,
            password: databaseConfig.password,
            port: databaseConfig.port,
            database: schemaName,
        };

        if (databaseConfig.ssl) connectionConfig.ssl = databaseConfig.ssl;

        const connection = await mysql.createConnection(connectionConfig);

        moduleConnections[casedModuleName] = {
            connection: connection,
            schemaName: schemaName,
            moduleName: casedModuleName,
        };
    } catch (err) {
        printErrorMessage(`Could not establish database connection: ${err?.sqlMessage ?? ""}`);
        printInfoMessage(
            `This could be due to invalid database configuration. Check your 'database.config.js' file (Or your node ENV variables)`,
        );
        console.log(err);
        process.exit(1);
    }
}

console.log(moduleConnections);
