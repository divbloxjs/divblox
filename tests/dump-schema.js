import { printErrorMessage, printInfoMessage } from "dx-cli-tools";
import { getConfig } from "../index.js";
import { getSqlFromCamelCase } from "../sync/sqlCaseHelpers.js";
import mysql from "mysql2/promise";

import * as fs from "fs";
import * as fsAsync from "fs/promises";
import { getCasedDataModel } from "../sync/optionValidation.js";

export default class DumpCreator {
    DUMPS_DIR = "./tests/current-dump";
    TABLES_FILE_PATH = `${this.DUMPS_DIR}/tables`;
    COLUMNS_FILE_PATH = `${this.DUMPS_DIR}/columns`;
    INDEXES_FILE_PATH = `${this.DUMPS_DIR}/indexes`;

    dxConfig = {};
    dataModel = {};
    databaseConfig = {};
    moduleConnections = {};

    async init() {
        const configOptions = await getConfig("tests/dx.config.js");
        this.dataModel = getCasedDataModel(configOptions.dataModel, configOptions.dxConfig.databaseCaseImplementation);
        this.databaseConfig = configOptions.databaseConfig;

        for (const { moduleName, schemaName } of this.databaseConfig.modules) {
            const casedModuleName = getSqlFromCamelCase(moduleName, configOptions.dxConfig.databaseCaseImplementation);
            try {
                const connectionConfig = {
                    host: this.databaseConfig.host,
                    user: this.databaseConfig.user,
                    password: this.databaseConfig.password,
                    port: this.databaseConfig.port,
                    database: schemaName,
                };

                if (this.databaseConfig.ssl) connectionConfig.ssl = this.databaseConfig.ssl;

                const connection = await mysql.createConnection(connectionConfig);

                this.moduleConnections[casedModuleName] = {
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
    }

    async createDumpsDir() {
        if (!fs.existsSync(this.DUMPS_DIR)) {
            fs.mkdirSync(this.DUMPS_DIR);
            printInfoMessage(`Created directory: ${this.DUMPS_DIR}`);
        }
    }

    async getTables() {
        for (const [moduleName, { connection, schemaName }] of Object.entries(this.moduleConnections)) {
            try {
                const [results] = await connection.query(
                    `SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '${schemaName}';`,
                );
                await fsAsync.writeFile(
                    `${this.TABLES_FILE_PATH}_${moduleName}.json`,
                    JSON.stringify(results, null, "\t"),
                    "utf-8",
                );
            } catch (err) {
                console.log(err);
            }
        }
    }

    async getColumns() {
        for (const [moduleName, { connection }] of Object.entries(this.moduleConnections)) {
            const moduleColumns = [];
            try {
                for (const [entityName, entityDefinition] of Object.entries(this.dataModel)) {
                    if (entityDefinition.module !== moduleName) continue;
                    const [results] = await connection.query(`DESCRIBE ${entityName}`);
                    moduleColumns.push(...results);
                }
            } catch (err) {
                console.log(err);
            }

            await fsAsync.writeFile(
                `${this.COLUMNS_FILE_PATH}_${moduleName}.json`,
                JSON.stringify(moduleColumns, null, "\t"),
                "utf-8",
            );
        }
    }

    async getIndexes() {
        for (const [moduleName, { connection, schemaName }] of Object.entries(this.moduleConnections)) {
            try {
                const [results] =
                    await connection.query(`SELECT S.TABLE_NAME, S.COLUMN_NAME, S.NULLABLE, S.INDEX_TYPE, RC.REFERENCED_TABLE_NAME
                    FROM INFORMATION_SCHEMA.STATISTICS S LEFT JOIN 
                    INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS RC
                    ON RC.CONSTRAINT_NAME = S.INDEX_NAME
                    WHERE S.INDEX_SCHEMA = '${schemaName}';`);

                await fsAsync.writeFile(
                    `${this.INDEXES_FILE_PATH}_${moduleName}.json`,
                    JSON.stringify(results, null, "\t"),
                    "utf-8",
                );
            } catch (err) {
                console.log(err);
            }
        }
    }
}
