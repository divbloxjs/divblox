import { printErrorMessage } from "dx-cli-tools";
import { readFileSync, writeFileSync } from "fs";

/**
 * Handles the command line input that is used to prepare the npm package for the new project
 * @return {Promise<void>}
 */
export const pullDataModel = async (dxApiKey, dataModelPath, uniqueIdentifier = "core") => {
    console.log(`pullDataModel() function not implemented yet...`);
    let response;
    try {
        response = await fetch(`http://localhost:4000/api/dataDesign/pullProjectDataModel/${uniqueIdentifier}`, {
            method: "POST",
            headers: { "Content-type": "application/json" },
            body: JSON.stringify({ dxApiKey: dxApiKey }),
        });
    } catch (err) {
        printErrorMessage("Could not connect to divblox.app right now");
        process.exit(1);
    }

    if (!response.ok) {
        printErrorMessage("Oops");
    }

    const result = await response.json();

    Object.keys(result).forEach((entityName) => {
        delete result[entityName].package;
        delete result[entityName].packageName;
        delete result[entityName].packageNameCamelCase;
        delete result[entityName].dataModellerCoordinates;
        delete result[entityName].generateCrud;
        delete result[entityName].singularEntityName;
        delete result[entityName].pluralEntityName;
    });

    writeFileSync(`${process.env.PWD}/${dataModelPath}`, JSON.stringify(result, null, "\t"));

    console.log("result", result);
};

export const pushDataModel = async (dxApiKey, dataModel, uniqueIdentifier = "core") => {
    console.log(`pushDataModel() function not implemented yet...`);
    let response;
    try {
        response = await fetch(`http://localhost:4000/api/dataDesign/pushProjectDataModel/${uniqueIdentifier}`, {
            method: "POST",
            headers: { "Content-type": "application/json" },
            body: JSON.stringify({ dxApiKey: dxApiKey, modelJson: dataModel }),
        });
    } catch (err) {
        printErrorMessage("Could not connect to divblox.app right now");
        process.exit(1);
    }

    if (!response.ok) {
        printErrorMessage("Oops");
    }

    const result = await response.json();
    console.log("result", result);
};
