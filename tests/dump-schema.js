import { printErrorMessage, printInfoMessage } from "dx-cli-tools";
import { getConfig } from "../index.js";
import { getSqlFromCamelCase } from "../sync/sqlCaseHelpers.js";
import mysql from "mysql2/promise";

import * as fs from "fs";
import * as fsAsync from "fs/promises";
import { getCasedDataModel } from "../sync/optionValidation.js";

let connection;
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

        try {
            connection = await mysql.createConnection(process.env.DATABASE_URL);
        } catch (err) {
            printErrorMessage(`Could not establish database connection: ${err?.sqlMessage ?? ""}`);
            printInfoMessage(`Provided process.env.DATABASE_URL: '${process.env.DATABASE_URL}'`);
            console.log(err);
            process.exit(1);
        }
    }

    async createDumpsDir() {
        if (!fs.existsSync(this.DUMPS_DIR)) {
            fs.mkdirSync(this.DUMPS_DIR);
            printInfoMessage(`Created directory: ${this.DUMPS_DIR}`);
        }
    }

    async getTables() {
        try {
            const [results] = await connection.query(
                `SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '${schemaName}';`,
            );
            await fsAsync.writeFile(`${this.TABLES_FILE_PATH}.json`, JSON.stringify(results, null, "\t"), "utf-8");
        } catch (err) {
            console.log(err);
        }
    }

    async getColumns() {
        const columns = [];
        try {
            for (const entityName of Object.keys(this.dataModel)) {
                const [results] = await connection.query(`DESCRIBE ${entityName}`);
                columns.push(...results);
            }
        } catch (err) {
            console.log(err);
        }

        await fsAsync.writeFile(`${this.COLUMNS_FILE_PATH}.json`, JSON.stringify(columns, null, "\t"), "utf-8");
    }

    async getIndexes() {
        try {
            const schemaName = process.env.DATABASE_URL.split("/").pop();
            const [results] =
                await connection.query(`SELECT S.TABLE_NAME, S.COLUMN_NAME, S.NULLABLE, S.INDEX_TYPE, RC.REFERENCED_TABLE_NAME
                    FROM INFORMATION_SCHEMA.STATISTICS S LEFT JOIN 
                    INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS RC
                    ON RC.CONSTRAINT_NAME = S.INDEX_NAME
                    WHERE S.INDEX_SCHEMA = '${schemaName}';`);

            await fsAsync.writeFile(`${this.INDEXES_FILE_PATH}.json`, JSON.stringify(results, null, "\t"), "utf-8");
        } catch (err) {
            console.log(err);
        }
    }
}
