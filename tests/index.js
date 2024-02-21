import { getConfig } from "../index.js";
import { syncDatabase } from "../sync/index.js";
import DumpComparer from "./compare-dumps.js";
import DumpCreator from "./dump-schema.js";
const configOptions = await getConfig("tests/dx.config.js");

await syncDatabase(configOptions, true);

const dumpCreator = new DumpCreator();
await dumpCreator.init();
await dumpCreator.createDumpsDir();
await dumpCreator.getTables();
await dumpCreator.getColumns();
await dumpCreator.getIndexes();

const dumpComparer = new DumpComparer();
await dumpComparer.init();
await dumpComparer.compareDumps();

process.exit(0);
