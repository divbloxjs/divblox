import { printErrorMessage, printSuccessMessage } from "dx-cli-tools";
import { writeFileSync } from "fs";

/**
 * Handles the command line input that is used to prepare the npm package for the new project
 * @return {Promise<void>}
 */
export const pullDataModel = async (dxApiKey, dataModelPath, uniqueIdentifier = "core") => {
    let response;
    try {
        response = await fetch(`https://api.divblox.app/api/dataDesign/pullProjectDataModel/${uniqueIdentifier}`, {
            method: "POST",
            headers: { "Content-type": "application/json" },
            body: JSON.stringify({ dxApiKey: dxApiKey }),
        });

        const result = await response.json();
        if (!response.ok) {
            printErrorMessage(`Error occurred pulling data model: ${result?.message ?? "No message provided"}`);
            process.exit(1);
        }

        Object.keys(result).forEach((entityName) => {
            delete result[entityName].package;
            delete result[entityName].packageName;
            delete result[entityName].packageNameCamelCase;
            delete result[entityName].generateCrud;
        });

        writeFileSync(`${process.cwd()}/${dataModelPath}`, JSON.stringify(result, null, "\t"));
        printSuccessMessage(`Successfully pulled '${uniqueIdentifier}' data model`);
    } catch (err) {
        printErrorMessage(
            "Could not connect to divblox.app right now. You can still sync locally by running divblox -s skip-pull",
        );
        process.exit(1);
    }
};

export const pushDataModel = async (dxApiKey, dataModel, uniqueIdentifier = "core") => {
    let response;
    try {
        response = await fetch(`https://api.divblox.app/api/dataDesign/pushProjectDataModel/${uniqueIdentifier}`, {
            method: "POST",
            headers: { "Content-type": "application/json" },
            body: JSON.stringify({ dxApiKey: dxApiKey, modelJson: dataModel }),
        });

        const result = await response.json();
        if (!response.ok) {
            printErrorMessage(`Error occurred pushing data model: ${result?.message ?? "No message provided"}`);
            process.exit(1);
        }

        printSuccessMessage(`Successfully pushed '${uniqueIdentifier}' data model`);
    } catch (err) {
        printErrorMessage("Could not connect to divblox.app right now");
        process.exit(1);
    }
};
