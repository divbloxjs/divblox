const CURRENT_DUMPS_DIR = "./tests/current-dump";
const VALID_DUMPS_DIR = "./tests/valid-dump";

import { printErrorMessage } from "dx-cli-tools";
import * as fsAsync from "fs/promises";
import path from "path";

export default class DumpComparer {
    currentDump;
    validDump;

    async init() {
        this.currentDump = await this.readFiles(CURRENT_DUMPS_DIR);
        this.validDump = await this.readFiles(VALID_DUMPS_DIR);
    }

    async readFiles(dirName) {
        const data = {};
        const files = await fsAsync.readdir(dirName);
        for (const fileName of files) {
            const full = path.join(dirName, fileName);
            const content = await fsAsync.readFile(full, { encoding: "utf8" });
            data[fileName] = JSON.parse(content);
        }
        return data;
    }

    async compareDumps() {
        for (const [dumpName, dumpData] of Object.entries(this.currentDump)) {
            let dumpMismatch = false;
            const messages = [];
            for (const [index, rowData] of dumpData.entries()) {
                for (const attributeName of Object.keys(rowData)) {
                    if (this.validDump[dumpName]?.[index]?.[attributeName] !== rowData[attributeName]) {
                        dumpMismatch = true;
                        messages.push({
                            row: index,
                            attributeName: attributeName,
                            valid: this.validDump[dumpName]?.[index]?.[attributeName],
                            current: rowData[attributeName],
                        });
                    }
                }
            }

            if (dumpMismatch) {
                printErrorMessage(`Mismatch(s) in ${dumpName} dump...`);
                console.log(messages);
            }
        }
    }
}
