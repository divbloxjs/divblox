import { DB_IMPLEMENTATION_TYPES } from "../constants.js";
import { getConfig } from "../index.js";
import { initializeDatabaseConnections, syncDatabase } from "../sync/index.js";

const configOptions = await getConfig("tests/dx.config.js");

let databaseCaseImplementation = DB_IMPLEMENTATION_TYPES.SNAKE_CASE;
let dataModel;
let databaseConfig = {
    host: "localhost",
    user: "dx_user",
    password: "secret",
    port: 3307,
    ssl: false,
    modules: [{ moduleName: "main", schemaName: "dxdbsynctest" }],
};

let moduleConnections = {};
let existingTables = {};

await syncDatabase(configOptions, true);

// for (const [moduleName, { connection, schemaName }] of Object.entries(moduleConnections)) {
//     try {
//         const [results] = await connection.query("SHOW FULL TABLES");
//         // SELECT * FROM `INFORMATION_SCHEMA`.`TABLES`
//         if (results.length === 0) {
//             continue;
//         }

//         console.log("results", results);
//         results.forEach((dataPacket) => {
//             tables[dataPacket[`Tables_in_${schemaName}`]] = {
//                 type: dataPacket["Table_type"],
//                 schemaName: schemaName,
//                 moduleName: moduleName,
//             };
//         });

//         outputFormattedLog(
//             `Module '${moduleName}' currently has ${results.length} table(s). Expected ${results.length} table(s)`,
//             SUB_HEADING_FORMAT,
//         );
//     } catch (err) {
//         await rollbackConnsAndExitProcess(
//             `Could not show full tables for '${moduleName}' in schema '${schemaName}': ${err?.sqlMessage ?? ""}`,
//             err,
//         );
//     }
// }
