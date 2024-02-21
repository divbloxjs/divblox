import { printErrorMessage, printInfoMessage } from "dx-cli-tools";
import { getConfig } from "../index.js";
import { getCaseNormalizedString } from "../sync/sqlCaseHelpers.js";
import mysql from "mysql2/promise";

import * as fs from "fs";
import * as fsAsync from "fs/promises";
import { getCasedDataModel } from "../sync/optionValidation.js";

const DUMPS_DIR = "./tests/dumps";
const TABLES_FILE_PATH = `${DUMPS_DIR}/tables`;
const COLUMNS_FILE_PATH = `${DUMPS_DIR}/columns`;
const INDEXES_FILE_PATH = `${DUMPS_DIR}/indexes`;

const configOptions = await getConfig("tests/dx.config.js");
configOptions.dataModel = getCasedDataModel(configOptions.dataModel, configOptions.dxConfig.databaseCaseImplementation);

let moduleConnections = {};
for (const { moduleName, schemaName } of configOptions.databaseConfig.modules) {
    const casedModuleName = getCaseNormalizedString(moduleName, configOptions.dxConfig.databaseCaseImplementation);
    try {
        const connectionConfig = {
            host: configOptions.databaseConfig.host,
            user: configOptions.databaseConfig.user,
            password: configOptions.databaseConfig.password,
            port: configOptions.databaseConfig.port,
            database: schemaName,
        };

        if (configOptions.databaseConfig.ssl) connectionConfig.ssl = configOptions.databaseConfig.ssl;

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

const createDumpsDir = async () => {
    if (!fs.existsSync(DUMPS_DIR)) {
        fs.mkdirSync(DUMPS_DIR);
        printInfoMessage(`Created directory: ${DUMPS_DIR}`);
    }
};

const getTables = async () => {
    for (const [moduleName, { connection, schemaName }] of Object.entries(moduleConnections)) {
        try {
            const [results] = await connection.query(
                `SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '${schemaName}';`,
            );
            await fsAsync.writeFile(
                `${TABLES_FILE_PATH}_${moduleName}.json`,
                JSON.stringify(results, null, "\t"),
                "utf-8",
            );
        } catch (err) {
            console.log(err);
        }
    }
};

const getColumns = async () => {
    for (const [moduleName, { connection }] of Object.entries(moduleConnections)) {
        const moduleColumns = [];
        try {
            for (const [entityName, entityDefinition] of Object.entries(configOptions.dataModel)) {
                if (entityDefinition.module !== moduleName) continue;
                const [results] = await connection.query(`DESCRIBE ${entityName}`);
                moduleColumns.push(...results);
            }
        } catch (err) {
            console.log(err);
        }

        await fsAsync.writeFile(
            `${COLUMNS_FILE_PATH}_${moduleName}.json`,
            JSON.stringify(moduleColumns, null, "\t"),
            "utf-8",
        );
    }
};

const getIndexes = async () => {
    for (const [moduleName, { connection, schemaName }] of Object.entries(moduleConnections)) {
        try {
            const [results] =
                await connection.query(`SELECT S.TABLE_NAME, S.COLUMN_NAME, S.NULLABLE, S.INDEX_TYPE, RC.REFERENCED_TABLE_NAME
                FROM INFORMATION_SCHEMA.STATISTICS S LEFT JOIN 
                INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS RC
                ON RC.CONSTRAINT_NAME = S.INDEX_NAME
                WHERE S.INDEX_SCHEMA = '${schemaName}';`);

            await fsAsync.writeFile(
                `${INDEXES_FILE_PATH}_${moduleName}.json`,
                JSON.stringify(results, null, "\t"),
                "utf-8",
            );
        } catch (err) {
            console.log(err);
        }
    }
};

await createDumpsDir();
await getTables();
await getColumns();
await getIndexes();
