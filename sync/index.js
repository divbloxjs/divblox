const { createHash } = await import("node:crypto");
import mysql from "mysql2/promise";

import {
    outputFormattedLog,
    getCommandLineInput,
    printErrorMessage,
    printInfoMessage,
    printSubHeadingMessage,
} from "dx-cli-tools/helpers.js";
import {
    DB_IMPLEMENTATION_TYPES,
    HEADING_FORMAT,
    SUB_HEADING_FORMAT,
    WARNING_FORMAT,
    SUCCESS_FORMAT,
} from "../constants.js";
import { validateDataModel, getCasedDataModel } from "./optionValidation.js";

import {
    getCamelCaseSplittedToLowerCase,
    convertLowerCaseToCamelCase,
    convertLowerCaseToPascalCase,
} from "dx-utilities";
import { getSqlFromCamelCase } from "./sqlCaseHelpers.js";

/**
 * @typedef {Object} DB_CONFIG_SSL_OPTIONS
 * @property {string} ca The path to the SSL ca
 * @property {string} key The path to the SSL key
 * @property {string} cert The path to the SSL cert
 */

let databaseCaseImplementation = DB_IMPLEMENTATION_TYPES.SNAKE_CASE;
let dataModel;

/** @type {import("mysql2").Connection} */
let connection;

/**
 * @param {Object} options Init options
 * @param {Object} options.dataModel The data model to synchronize
 * @param {keyof DB_IMPLEMENTATION_TYPES} options.databaseCaseImplementation
 */
export const initializeDatabaseConnections = async (options = {}) => {
    if (options?.dxConfig?.databaseCaseImplementation) {
        if (!Object.values(DB_IMPLEMENTATION_TYPES).includes(options.dxConfig.databaseCaseImplementation)) {
            printErrorMessage(`Invalid case implementation provided: ${options.dxConfig.databaseCaseImplementation}`);
            console.log(`Allowed options: ${Object.values(DB_IMPLEMENTATION_TYPES).join(", ")}`);
            process.exit(1);
        }

        databaseCaseImplementation = options.dxConfig.databaseCaseImplementation;
    }

    dataModel = validateDataModel(options?.dataModel, databaseCaseImplementation);
    if (!dataModel) process.exit(1);

    dataModel = getCasedDataModel(dataModel, databaseCaseImplementation);

    if (!process.env.DATABASE_URL) {
        printErrorMessage(`Env variable 'DATABASE_URL' not provided`);
        process.exit(1);
    }
    try {
        connection = await mysql.createConnection(process.env.DATABASE_URL);
    } catch (err) {
        printErrorMessage(`Could not establish database connection: ${err?.sqlMessage ?? ""}`);
        printInfoMessage(`Provided process.env.DATABASE_URL: '${process.env.DATABASE_URL}'`);
        console.log(err);
        process.exit(1);
    }

    outputFormattedLog("Database connection established...", SUB_HEADING_FORMAT);
};

let existingTables = {};
export const syncDatabase = async (options = {}, skipUserPrompts = false) => {
    startNewCommandLineSection("Initializing...");
    await initializeDatabaseConnections(options);
    // 1. Checking if data model and database connections are correct
    await checkDataModelIntegrity();

    await connection.beginTransaction();
    await disableFKChecks();

    // 2. Get existing tables in database
    existingTables = await getDatabaseTables();
    const existingTableNames = Object.keys(existingTables);
    const expectedTableNames = [];

    for (const entityName of Object.keys(dataModel)) {
        expectedTableNames.push(entityName);
    }

    startNewCommandLineSection("Removing unknown tables...");

    const tablesToRemove = existingTableNames.filter((name) => !expectedTableNames.includes(name));
    await removeTables(tablesToRemove, skipUserPrompts);

    startNewCommandLineSection("Creating new tables...");
    const tablesToCreate = expectedTableNames.filter((name) => !existingTableNames.includes(name));
    await createTables(tablesToCreate);

    // 4a. We call updateRelationships here to ensure any redundant foreign key constraints are removed before
    //      attempting to update the tables. This sidesteps any constraint-related errors
    await updateRelationships(true);

    // 4. Loop through all the entities in the data model and update their corresponding database tables
    //      to ensure that their columns match the data model attribute names and types
    await updateTables();

    // 5. Loop through all the entities in the data model and update their corresponding database tables
    //      to ensure that their indexes match the data model indexes
    await updateIndexes();

    // 6. Loop through all the entities in the data model and update their corresponding database tables
    //      to ensure that their relationships match the data model relationships. Here we either create new
    //      foreign key constraints or drop existing ones where necessary
    await updateRelationships();

    startNewCommandLineSection("Database sync completed successfully!");

    await connection.commit();
    connection.destroy();
};

const rollbackAndExitProcess = async (message, err) => {
    if (message) printErrorMessage(message);
    if (err) console.log(err);

    try {
        await connection.rollback();
        connection.destroy();
    } catch (err) {
        printErrorMessage(`Could not rollback and close connections properly`);
        console.log(err);
    }

    process.exit(1);
};

//#region Main Functions
/**
 * Returns the tables that are currently in the database
 * @return {Promise<{}>} Returns the name and type of each table
 */
const getDatabaseTables = async () => {
    let tables = [];
    try {
        const [results] = await connection.query("SHOW FULL TABLES");

        results.forEach((dataPacket) => {
            const schemaName = process.env.DATABASE_URL.split("/").pop();
            tables[dataPacket[`Tables_in_${schemaName}`]] = {
                type: dataPacket["Table_type"],
            };
        });

        outputFormattedLog(`${results.length} table(s) found. Expected ${results.length} table(s)`, SUB_HEADING_FORMAT);
    } catch (err) {
        await rollbackAndExitProcess(`Could not show full tables: ${err?.sqlMessage ?? ""}`, err);
    }

    return tables;
};

const removeTables = async (tablesToRemove = [], skipUserPrompts = false) => {
    if (tablesToRemove.length === 0) {
        outputFormattedLog("There are no tables to remove", SUB_HEADING_FORMAT);
        return;
    }

    let answer = "none"; // This is the default is user prompts are auto-accepted (accept-all CLI flag passed)
    if (!skipUserPrompts) {
        answer = await getCommandLineInput(
            `Removing tables that are not defined in the provided data model...
${tablesToRemove.length} tables should be removed.
How would you like to proceed?
    - Type 'y' to confirm & remove one-by-one;
    - Type 'all' to remove all;
    - Type 'none' to skip removing any tables;
    - Type 'list' to show tables that will be removed (y|all|none|list) `,
        );
    }

    switch (answer.toString().toLowerCase()) {
        case "list":
            listTablesToRemove(tablesToRemove);
            const answerList = await getCommandLineInput(
                `How would you like to proceed?
    - Type 'y' to confirm & remove one-by-one;
    - Type 'all' to remove all;
    - Type 'none' to skip removing any tables; (y|all|none) `,
            );
            switch (answerList.toString().toLowerCase()) {
                case "y":
                    await removeTablesRecursive(tablesToRemove, true);
                    break;
                case "all":
                    await removeTablesRecursive(tablesToRemove, false);
                    break;
                case "none":
                    return;
                default:
                    printErrorMessage("Invalid selection. Please try again.");
                    await removeTables(tablesToRemove, skipUserPrompts);
                    return;
            }
            break;
        case "all":
            await removeTablesRecursive(tablesToRemove, false);
            break;
        case "y":
            await removeTablesRecursive(tablesToRemove, true);
            break;
        case "none":
            return;
        default:
            printErrorMessage("Invalid selection. Please try again.");
            await removeTables(tablesToRemove, skipUserPrompts);
    }
};

const removeTablesRecursive = async (tablesToRemove = [], mustConfirm = true) => {
    if (tablesToRemove.length === 0) return;

    if (!mustConfirm) {
        // Not going to be recursive. Just a single call to drop all relevant tables
        const tablesToDropStr = tablesToRemove.join(",");

        try {
            await connection.query(`DROP TABLE IF EXISTS ${tablesToDropStr}`);
            outputFormattedLog(`Removed table(s): ${tablesToDropStr}`, SUB_HEADING_FORMAT);
        } catch (err) {
            await rollbackAndExitProcess(`Error dropping tables '${tablesToDropStr}': ${err?.sqlMessage ?? ""}`, err);
        }

        return;
    }

    const answer = await getCommandLineInput(`Drop table '${tablesToRemove[0]}'? (y/n) `);
    if (answer.toString().toLowerCase() === "y") {
        try {
            await connection.query(`DROP TABLE IF EXISTS ${tablesToRemove[0]}`);
            outputFormattedLog(`Removed table(s): ${tablesToRemove[0]}`, SUB_HEADING_FORMAT);
        } catch (err) {
            await rollbackAndExitProcess(`Could not drop table '${tablesToRemove[0]}': ${err?.sqlMessage ?? ""}`, err);
        }
    }

    tablesToRemove.shift();

    await removeTablesRecursive(tablesToRemove, true);
};

const createTables = async (tablesToCreate = []) => {
    if (tablesToCreate.length === 0) {
        outputFormattedLog("There are no tables to create", SUB_HEADING_FORMAT);
        return;
    }

    for (const tableName of tablesToCreate) {
        const createTableSql = `CREATE TABLE ${tableName} (
                ${getPrimaryKeyColumn()} INT NOT NULL AUTO_INCREMENT,
                PRIMARY KEY (${getPrimaryKeyColumn()})
                )`;

        try {
            await connection.query(createTableSql);
        } catch (err) {
            await rollbackAndExitProcess(`Could not create table '${tableName}': ${err?.sqlMessage}`, err);
        }
    }

    outputFormattedLog(`${tablesToCreate.length} new table(s) created`, SUB_HEADING_FORMAT);
};

const updateTables = async () => {
    let updatedTables = [];
    let queryStringsToExecute = [];

    for (const entityName of Object.keys(dataModel)) {
        const [tableColumns] = await connection.query(`SHOW FULL COLUMNS FROM ${entityName}`);
        let tableColumnsNormalized = {};
        const entityAttributeDefinitions = dataModel[entityName]["attributes"];
        const expectedColumns = getEntityExpectedColumns(entityName);

        let attributesProcessed = [];
        let relationshipsProcessed = [];

        for (const tableColumn of tableColumns) {
            const columnName = tableColumn["Field"];
            attributesProcessed.push(tableColumn["Field"]);

            if (columnName === getPrimaryKeyColumn()) continue;

            // Let's check for columns to drop
            if (!expectedColumns.includes(columnName)) {
                queryStringsToExecute.push(`ALTER TABLE ${entityName} DROP COLUMN ${tableColumn["Field"]};`);
                if (!updatedTables.includes(entityName)) updatedTables.push(entityName);
                continue;
            }

            // Now, let's check if the existing columns' configurations align with our data model
            const allowNull = tableColumn["Null"] !== "NO";
            const typeParts = tableColumn["Type"].split("(");
            const baseType = typeParts[0];
            const typeLength = typeParts.length > 1 ? typeParts[1].replace(")", "") : null;

            tableColumnsNormalized[tableColumn["Field"]] = {
                type: baseType,
                lengthOrValues: typeLength,
                default: tableColumn["Default"],
                allowNull: allowNull,
            };

            for (const columnOption of Object.keys(tableColumnsNormalized[tableColumn["Field"]])) {
                if (typeof entityAttributeDefinitions[columnName] === "undefined") {
                    if (columnName !== getLockingConstraintColumn()) {
                        // This must mean that the column is a foreign key column
                        if (tableColumnsNormalized[tableColumn["Field"]]["type"].toLowerCase() !== "int") {
                            // This column needs to be fixed. Somehow its type got changed
                            queryStringsToExecute.push(`ALTER TABLE ${entityName} MODIFY COLUMN ${columnName} INT;`);
                            if (!updatedTables.includes(entityName)) updatedTables.push(entityName);
                        }

                        relationshipsProcessed.push(columnName);
                    } else {
                        // This is the locking constraint column
                        if (tableColumnsNormalized[tableColumn["Field"]]["type"].toLowerCase() !== "datetime") {
                            // This column needs to be fixed. Somehow its type got changed
                            queryStringsToExecute.push(
                                `ALTER TABLE ${entityName} MODIFY COLUMN ${columnName} datetime DEFAULT CURRENT_TIMESTAMP;`,
                            );
                            if (!updatedTables.includes(entityName)) updatedTables.push(entityName);
                        }

                        attributesProcessed.push(columnName);
                    }
                    break;
                }

                let dataModelOption =
                    columnOption === "lengthOrValues" && entityAttributeDefinitions[columnName][columnOption] !== null
                        ? entityAttributeDefinitions[columnName][columnOption].toString()
                        : entityAttributeDefinitions[columnName][columnOption];

                if (
                    columnOption === "type" &&
                    typeof dataModelOption === "string" &&
                    dataModelOption.toLowerCase() === "boolean"
                ) {
                    dataModelOption = "tinyint";
                } else if (
                    dataModelOption === null &&
                    columnOption === "lengthOrValues" &&
                    tableColumnsNormalized[tableColumn["Field"]].type === "tinyint"
                ) {
                    dataModelOption = "1";
                }

                // TODO need to spend some time here to see what other fields mismatch... (any defined int + others)
                if (
                    columnOption === "type" &&
                    typeof dataModelOption === "string" &&
                    dataModelOption.toLowerCase() === "bigint"
                ) {
                    dataModelOption = "bigint";
                } else if (columnOption === "lengthOrValues") {
                    if (tableColumnsNormalized[tableColumn["Field"]].type === "bigint") {
                        dataModelOption = 20;
                    } else if (tableColumnsNormalized[tableColumn["Field"]].type === "int") {
                        dataModelOption = 11;
                    } else if (tableColumnsNormalized[tableColumn["Field"]].type === "decimal") {
                        dataModelOption = dataModelOption ?? "10,0"; // Default for unset decimal length
                    }
                }

                if (typeof dataModelOption === "string") dataModelOption = dataModelOption.toLocaleLowerCase();
                if (typeof tableColumnsNormalized[tableColumn["Field"]][columnOption] === "string")
                    tableColumnsNormalized[tableColumn["Field"]][columnOption] =
                        tableColumnsNormalized[tableColumn["Field"]][columnOption].toLocaleLowerCase();

                if (dataModelOption != tableColumnsNormalized[tableColumn["Field"]][columnOption]) {
                    queryStringsToExecute.push(
                        `ALTER TABLE ${entityName} ${getAlterColumnSql(
                            columnName,
                            entityAttributeDefinitions[columnName],
                            "MODIFY",
                        )}`,
                    );
                    if (!updatedTables.includes(entityName)) updatedTables.push(entityName);

                    break;
                }
            }
        }

        // Now, let's create any remaining new columns
        let entityAttributesArray = Object.keys(entityAttributeDefinitions);
        entityAttributesArray.push(getPrimaryKeyColumn());

        if (dataModel[entityName]?.["options"]?.["enforceLockingConstraints"] !== false) {
            entityAttributesArray.push(getLockingConstraintColumn());
        }

        const columnsToCreate = entityAttributesArray.filter((x) => !attributesProcessed.includes(x));
        for (const columnName of columnsToCreate) {
            const columnDataModelObject =
                columnName === getLockingConstraintColumn()
                    ? {
                          type: "datetime",
                          lengthOrValues: null,
                          default: "CURRENT_TIMESTAMP",
                          allowNull: false,
                      }
                    : entityAttributeDefinitions[columnName];

            queryStringsToExecute.push(
                `ALTER TABLE ${entityName} ${getAlterColumnSql(columnName, columnDataModelObject, "ADD")}`,
            );

            if (!updatedTables.includes(entityName)) updatedTables.push(entityName);
        }

        const entityRelationshipColumns = getEntityRelationshipColumns(entityName);
        const relationshipColumnsToCreate = entityRelationshipColumns.filter(
            (x) => !relationshipsProcessed.includes(x),
        );

        for (const relationshipColumnToCreate of relationshipColumnsToCreate) {
            queryStringsToExecute.push(`ALTER TABLE ${entityName} ADD COLUMN ${relationshipColumnToCreate} INT(11);`);

            if (!updatedTables.includes(entityName)) updatedTables.push(entityName);
        }
    }

    for (const queryStr of queryStringsToExecute) {
        try {
            await connection.query(queryStr);
        } catch (err) {
            await rollbackAndExitProcess(`Could not execute query: ${err?.sqlMessage}`, err);
        }
    }

    outputFormattedLog(`${updatedTables.length} tables were updated`, SUB_HEADING_FORMAT);
};

/**
 * Cycles through all the indexes for each table to ensure they align with their data model definition
 * @return {Promise<void>} True if all good, false otherwise. If false, the errorInfo array will be populated
 * with a relevant reason
 */
const updateIndexes = async () => {
    startNewCommandLineSection("Updating indexes...");

    let updatedIndexes = { added: 0, removed: 0 };

    for (const entityName of Object.keys(dataModel)) {
        const [existingIndexDataArray] =
            await connection.query(`SELECT S.TABLE_NAME, S.INDEX_NAME, S.COLUMN_NAME, S.NULLABLE, S.INDEX_TYPE, RC.REFERENCED_TABLE_NAME
                        FROM INFORMATION_SCHEMA.STATISTICS S LEFT JOIN 
                        INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS RC
                        ON RC.CONSTRAINT_NAME = S.INDEX_NAME
                        WHERE S.TABLE_NAME = '${entityName}';`);
        let existingIndexes = [];
        for (const index of existingIndexDataArray) {
            existingIndexes.push(index["INDEX_NAME"]);
        }

        const entityRelationshipConstraints = getEntityRelationshipConstraint(entityName);
        const expectedIndexNames = entityRelationshipConstraints.map((obj) => obj.constraintName);
        for (const indexObj of dataModel[entityName].indexes) {
            const indexName = indexObj.indexName;
            expectedIndexNames.push(indexName);

            if (!existingIndexes.includes(indexName)) {
                // Let's add this index
                const keyColumn = indexObj["attribute"];

                let addIndexSqlString = "";
                switch (indexObj["indexChoice"].toLowerCase()) {
                    case "index":
                        addIndexSqlString = `ALTER TABLE ${entityName} ADD INDEX ${indexName} (${keyColumn}) USING ${indexObj["type"]};`;
                        break;
                    case "unique":
                        addIndexSqlString = `ALTER TABLE ${entityName} ADD UNIQUE ${indexName} (${keyColumn}) USING ${indexObj["type"]};`;
                        break;
                    case "spatial":
                        addIndexSqlString = `ALTER TABLE ${entityName} ADD SPATIAL ${indexName} (${keyColumn})`;
                        break;
                    case "fulltext":
                        addIndexSqlString = `ALTER TABLE ${entityName} ADD FULLTEXT ${indexName} (${keyColumn})`;
                        break;
                    default:
                        await rollbackAndExitProcess(
                            `Invalid index choice specified for '${indexObj["indexName"]}' on '${entityName}'.
                            Provided: '${indexObj["indexChoice"]}'.
                            Valid options: index|unique|fulltext|spatial`,
                        );
                }

                try {
                    await connection.query(addIndexSqlString);
                } catch (err) {
                    await rollbackAndExitProcess(
                        `Could not add ${indexObj[
                            "indexChoice"
                        ].toUpperCase()} '${indexName}' to table '${entityName}': 
                        ${err?.sqlMessage ?? ""}`,
                        err,
                    );
                }

                updatedIndexes.added++;
            }
        }

        for (const { INDEX_NAME: existingIndex, REFERENCED_TABLE_NAME } of existingIndexDataArray) {
            if (existingIndex.toLowerCase() === "primary") {
                continue;
            }

            if (REFERENCED_TABLE_NAME) {
                // FK Index - handled elsewhere - do NOT drop
                continue;
            }

            if (!expectedIndexNames.includes(existingIndex)) {
                try {
                    await connection.query(`ALTER TABLE ${entityName} DROP INDEX \`${existingIndex}\`;`);
                } catch (err) {
                    await rollbackAndExitProcess(
                        `Could not drop INDEX ${existingIndex} to table ${entityName}: ${err?.sqlMessage ?? ""}`,
                        err,
                    );
                }

                updatedIndexes.removed++;
            }
        }
    }

    outputFormattedLog(`${updatedIndexes.added} Indexes added`, SUB_HEADING_FORMAT);
    outputFormattedLog(`${updatedIndexes.added} Indexes removed`, SUB_HEADING_FORMAT);
};

/**
 * Cycles through all the relationships for each table to ensure they align with their data model definition
 * @return {Promise<boolean>} True if all good, false otherwise. If false, the errorInfo array will be populated
 * with a relevant reason
 */
const updateRelationships = async (dropOnly = false) => {
    if (dropOnly) {
        startNewCommandLineSection("Removing redundant relationships...");
    } else {
        startNewCommandLineSection("Updating relationships...");
    }

    let updatedRelationships = { added: 0, removed: 0 };
    let existingForeignKeyDataArray = [];

    for (const entityName of Object.keys(dataModel)) {
        const entityRelationshipConstraints = getEntityRelationshipConstraint(entityName);
        try {
            const [results] = await connection.query(`SELECT KCU.* FROM
                INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS RC INNER JOIN
                INFORMATION_SCHEMA.KEY_COLUMN_USAGE KCU ON RC.CONSTRAINT_NAME = KCU.CONSTRAINT_NAME
                WHERE KCU.TABLE_NAME = '${entityName}';`);
            for (const foreignKeyResult of results) {
                let foundConstraint = null;
                const resultUniqueCombination = `${foreignKeyResult.TABLE_NAME}_${foreignKeyResult.REFERENCED_TABLE_NAME}_${foreignKeyResult.COLUMN_NAME}`;
                if (entityRelationshipConstraints.length) {
                    foundConstraint = entityRelationshipConstraints.find(
                        (obj) => obj.dataModelUniqueCombination === resultUniqueCombination,
                    );
                }

                if (!foundConstraint) {
                    try {
                        await connection.query(`ALTER TABLE ${entityName}
                            DROP FOREIGN KEY \`${foreignKeyResult.CONSTRAINT_NAME}\`;`);
                    } catch (err) {
                        await rollbackAndExitProcess(
                            `Could not drop FK '${foreignKeyResult.CONSTRAINT_NAME}': ${err?.sqlMessage}`,
                            err,
                        );
                    }

                    updatedRelationships.removed++;
                } else {
                    existingForeignKeyDataArray.push(foreignKeyResult);
                }
            }
        } catch (err) {
            await rollbackAndExitProcess(
                `Could not get schema information for '${moduleName}': ${err?.sqlMessage}`,
                err,
            );
        }

        if (dropOnly) {
            continue;
        }

        const entityRelationshipConstraintsToCreate = entityRelationshipConstraints.filter(
            (x) =>
                !existingForeignKeyDataArray
                    .map((existingForeignKeyData) => {
                        return `${existingForeignKeyData.TABLE_NAME}_${existingForeignKeyData.REFERENCED_TABLE_NAME}_${existingForeignKeyData.COLUMN_NAME}`;
                    })
                    .includes(x.dataModelUniqueCombination),
        );

        for (const foreignKeyToCreate of entityRelationshipConstraintsToCreate) {
            try {
                await connection.query(`ALTER TABLE ${entityName}
                ADD CONSTRAINT \`${foreignKeyToCreate.constraintName}\` 
                FOREIGN KEY (${foreignKeyToCreate.columnName})
                REFERENCES ${foreignKeyToCreate.relatedEntityName} (${getPrimaryKeyColumn()})
                ON DELETE SET NULL ON UPDATE CASCADE;`);
            } catch (err) {
                await rollbackAndExitProcess(
                    `Could not add FK ${foreignKeyToCreate.dataModelUniqueCombination} (${foreignKeyToCreate.constraintName})': ${err?.sqlMessage}`,
                    err,
                );
            }

            updatedRelationships.added++;
        }
    }

    outputFormattedLog(`${updatedRelationships.added} Relationships added`, SUB_HEADING_FORMAT);
    outputFormattedLog(`${updatedRelationships.removed} Relationships removed`, SUB_HEADING_FORMAT);
};
//#endregion

/**
 * Returns the constraint and column name that will be created in the database to represent the relationships for the given entity
 * @param entityName The name of the entity for which to determine relationship columns
 * @return {*[]} An array of constraint and column names in an object
 */
const getEntityRelationshipConstraint = (entityName) => {
    let entityRelationshipConstraint = [];
    const entityRelationships = dataModel[entityName]["relationships"];
    for (const relatedEntityName of Object.keys(entityRelationships)) {
        for (const relationshipAttributeName of entityRelationships[relatedEntityName]) {
            const dataModelUniqueCombination = `${entityName}_${relatedEntityName}_${relationshipAttributeName}`;
            const uniqueIdentifierRaw = Date.now().toString() + Math.round(1000000 * Math.random()).toString();
            const uniqueIdentifier = createHash("md5").update(uniqueIdentifierRaw).digest("hex");
            entityRelationshipConstraint.push({
                relatedEntityName: relatedEntityName,
                columnName: relationshipAttributeName,
                dataModelUniqueCombination: dataModelUniqueCombination,
                constraintName: uniqueIdentifier,
            });
        }
    }

    return entityRelationshipConstraint;
};

/**
 * Returns the names of the table columns expected for a given entity
 * @param entityName The name of the entity
 * @return {string[]} An array of column names
 */
const getEntityExpectedColumns = (entityName) => {
    let expectedColumns = [getPrimaryKeyColumn()];

    for (const attributeColumn of Object.keys(dataModel[entityName]["attributes"])) {
        expectedColumns.push(attributeColumn);
    }

    for (const relationshipColumn of getEntityRelationshipColumns(entityName)) {
        expectedColumns.push(relationshipColumn);
    }

    if (
        typeof dataModel[entityName]["options"] !== "undefined" &&
        typeof dataModel[entityName]["options"]["enforceLockingConstraints"] !== "undefined"
    ) {
        if (dataModel[entityName]["options"]["enforceLockingConstraints"] !== false) {
            expectedColumns.push(getLockingConstraintColumn());
        }
    }

    return expectedColumns;
};

/**
 * A utility function that returns the sql to alter a table based on the data model structure provided
 * @param {string} columnName The name of the column to alter
 * @param {*} columnDataModelObject An object containing information regarding the make-up of the column
 * @param {string} columnDataModelObject.type The type of the column
 * @param {null|string|int} columnDataModelObject.lengthOrValues If column type is "enum" or "set", please enter the
 * values using this format: 'a','b','c'
 * @param {null|value|"CURRENT_TIMESTAMP"} columnDataModelObject.default The default value for the column
 * @param {boolean} columnDataModelObject.allowNull Whether to allow null or not for the column
 * @param {string} operation "ADD|MODIFY"
 * @return {string} The sql alter code
 */
const getAlterColumnSql = (columnName = "", columnDataModelObject = {}, operation = "MODIFY") => {
    let sql = `${operation} COLUMN ${columnName} ${columnDataModelObject["type"]}`;

    if (columnName === getPrimaryKeyColumn()) {
        sql = `${operation} COLUMN ${getPrimaryKeyColumn()} INT NOT NULL AUTO_INCREMENT FIRST, 
            ADD PRIMARY KEY (${getPrimaryKeyColumn()});`;
        return sql;
    }

    if (columnDataModelObject["lengthOrValues"]) {
        sql += `(${columnDataModelObject["lengthOrValues"]})`;
    }

    if (columnDataModelObject["allowNull"] === false) {
        sql += " NOT NULL";
    }

    const validDefault =
        columnDataModelObject["default"] !== null &&
        columnDataModelObject["default"] !== undefined &&
        columnDataModelObject["default"] !== "";
    if (validDefault) {
        if (columnDataModelObject["default"] !== "CURRENT_TIMESTAMP") {
            sql += ` DEFAULT '${columnDataModelObject["default"]}';`;
        } else {
            sql += " DEFAULT CURRENT_TIMESTAMP;";
        }
    } else if (columnDataModelObject["allowNull"] !== false) {
        sql += " DEFAULT NULL;";
    }

    return sql;
};

/**
 * A wrapper function that returns the "id" column, formatted to the correct case, that is used as the primary key
 * column for all tables
 * @return {string} Either "id" or "Id"
 */
const getPrimaryKeyColumn = () => {
    switch (databaseCaseImplementation.toLowerCase()) {
        case DB_IMPLEMENTATION_TYPES.SNAKE_CASE:
            return "id";
        case DB_IMPLEMENTATION_TYPES.PASCAL_CASE:
            return "Id";
        case DB_IMPLEMENTATION_TYPES.CAMEL_CASE:
            return "id";
        default:
            return "id";
    }
};

/**
 * Divblox supports logic in its built-in ORM that determines whether a locking constraint is in place when
 * attempting to update a specific table. A column "lastUpdated|LastUpdated|last_updated" is used to log when last
 * a given table was updated to determine whether a locking constraint should be applied.
 * @return {string} Either "lastUpdated", "LastUpdated" or "last_updated"
 */
const getLockingConstraintColumn = () => {
    switch (databaseCaseImplementation.toLowerCase()) {
        case DB_IMPLEMENTATION_TYPES.SNAKE_CASE:
            return "last_updated";
        case DB_IMPLEMENTATION_TYPES.PASCAL_CASE:
            return "LastUpdated";
        case DB_IMPLEMENTATION_TYPES.CAMEL_CASE:
            return "lastUpdated";
        default:
            return "last_updated";
    }
};

/**
 * Returns the columns that will be created in the database to represent the relationships for the given entity
 * @param entityName The name of the entity for which to determine relationship columns
 * @return {*[]} An array of column names
 */
const getEntityRelationshipColumns = (entityName) => {
    let entityRelationshipColumns = [];
    const entityRelationships = dataModel[entityName]["relationships"];
    for (const relatedEntityName of Object.keys(entityRelationships)) {
        for (const relationshipAttributeName of entityRelationships[relatedEntityName]) {
            entityRelationshipColumns.push(relationshipAttributeName);
        }
    }
    return entityRelationshipColumns;
};

const checkDataModelIntegrity = async () => {
    try {
        const [results] = await connection.query("SHOW ENGINES");
        for (const row of results) {
            if (row["Engine"].toLowerCase() === "innodb") {
                if (row["Support"].toLowerCase() !== "default") {
                    printErrorMessage(`The active database engine is NOT InnoDB. Cannot proceed`);
                    process.exit(1);
                }
            }
        }
    } catch (err) {
        connection.rollback();
        printErrorMessage(`Could not check database engine`);
        console.log(err);
        process.exit(1);
    }

    outputFormattedLog("Data model integrity check succeeded!", SUB_HEADING_FORMAT);
};

const startNewCommandLineSection = (sectionHeading = "") => {
    const lineText = "-".repeat(process.stdout.columns);
    outputFormattedLog(lineText, HEADING_FORMAT);
    outputFormattedLog(sectionHeading, HEADING_FORMAT);
    outputFormattedLog(lineText, HEADING_FORMAT);
};

/**
 * A helper function that disables foreign key checks on the database
 * @return {Promise<boolean>}
 */
const disableFKChecks = async () => {
    try {
        await connection.query("SET FOREIGN_KEY_CHECKS = 0");
    } catch (err) {
        await connection.rollback();
        printErrorMessage(`Could not disable FK checks for '${moduleName}': ${err?.sqlMessage ?? ""}`);
        console.log(err);
        return false;
    }

    return true;
};

/**
 * Prints the tables that are to be removed to the console
 */
const listTablesToRemove = (tablesToRemove) => {
    for (const tableName of tablesToRemove) {
        const type = existingTables[tableName]?.type;
        outputFormattedLog(`${tableName} (${type})`, SUCCESS_FORMAT);
    }
};
