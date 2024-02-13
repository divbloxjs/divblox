import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { exec } from "child_process";
/**
 * A color reference to be used with outputFormattedLog()
 */
const commandLineColors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    underscore: "\x1b[4m",
    blink: "\x1b[5m",
    reverse: "\x1b[7m",
    hidden: "\x1b[8m",
    foregroundBlack: "\x1b[30m",
    foregroundRed: "\x1b[31m",
    foregroundGreen: "\x1b[32m",
    foregroundYellow: "\x1b[33m",
    foregroundBlue: "\x1b[34m",
    foregroundMagenta: "\x1b[35m",
    foregroundCyan: "\x1b[36m",
    foregroundWhite: "\x1b[37m",
    backgroundBlack: "\x1b[40m",
    backgroundRed: "\x1b[41m",
    backgroundGreen: "\x1b[42m",
    backgroundYellow: "\x1b[43m",
    backgroundBlue: "\x1b[44m",
    backgroundMagenta: "\x1b[45m",
    backgroundCyan: "\x1b[46m",
    backgroundWhite: "\x1b[47m",
};

/**
 * A more readable and friendly way to present colors for printing certain cases to the console
 */
const commandLineFormats = {
    heading: "heading",
    subHeading: "subHeading",
    default: "default",
    primary: "primary",
    secondary: "secondary",
    success: "success",
    danger: "danger",
    warning: "warning",
    info: "info",
    light: "light",
    dark: "dark",
    terminal: "terminal",
};

/**
 * Returns a combination of colors and setup for certain output types
 * @param {[string]} formats An array of commandLineFormats
 * @return {string} The final format to be applied to the text being printed in the console
 */
export const getCommandLineFormat = (formats = []) => {
    let finalFormat = commandLineColors.reset;
    for (const format of formats) {
        switch (format) {
            case commandLineFormats.heading:
                finalFormat += commandLineColors.bright;
                break;
            case commandLineFormats.subHeading:
                finalFormat += commandLineColors.dim;
                break;
            case commandLineFormats.default:
                finalFormat += commandLineColors.reset;
                break;
            case commandLineFormats.primary:
                finalFormat += commandLineColors.foregroundBlue;
                break;
            case commandLineFormats.secondary:
                finalFormat += commandLineColors.foregroundCyan;
                break;
            case commandLineFormats.success:
                finalFormat += commandLineColors.foregroundGreen;
                break;
            case commandLineFormats.danger:
                finalFormat += commandLineColors.foregroundRed;
                break;
            case commandLineFormats.warning:
                finalFormat += commandLineColors.foregroundYellow;
                break;
            case commandLineFormats.info:
                finalFormat += commandLineColors.foregroundMagenta;
                break;
            case commandLineFormats.light:
                finalFormat += commandLineColors.foregroundWhite;
                break;
            case commandLineFormats.dark:
                finalFormat += commandLineColors.foregroundBlack;
                break;
            case commandLineFormats.terminal:
                finalFormat += commandLineColors.foregroundWhite + commandLineColors.backgroundBlack;
                break;
        }
    }
    return finalFormat;
};

/**
 * Returns the user's input to the given command line question
 * @param {string} question
 * @returns {Promise<unknown>}
 */
export const getCommandLineInput = async (question = "") => {
    const rl = readline.createInterface({ input, output });

    const answer = await rl.question(question);
    rl.close();
    return answer;
};

/**
 * Executes a command on the terminal
 * @param command The command to execute
 * @return {Promise<{stdout, stderr}>}
 */
export const executeCommand = async (command) => {
    try {
        const { stdout, stderr } = exec(command);
        return { stdout, stderr };
    } catch (e) {
        console.error(e); // should contain code (exit code) and signal (that caused the termination).
    }
};

/**
 * Prints a log to the console, using the provided formatting
 * @param message The message to print
 * @param colorReference The color reference to use. See commandLineColors
 */
export const outputFormattedLog = (message, colorReference) => {
    console.log(colorReference + "%s" + commandLineColors.reset, message);
};

/**
 * Prints a formatted message to the console for the given type and color. Useful when you want to apply consistent
 * styling to your console messages
 * @param {string} message The message to print to the console
 * @param {string} messageType A type defined in commandLineFormats
 * @param {string} messageColor A color reference defined in commandLineFormats
 */
export const printFormattedMessage = (
    message = "",
    messageType = commandLineFormats.default,
    messageColor = commandLineFormats.dark,
) => {
    let lineText = "";
    for (let i = 0; i < process.stdout.columns; i++) {
        lineText += "-";
    }

    switch (messageType) {
        case commandLineFormats.heading:
            outputFormattedLog(lineText, getCommandLineFormat([messageType, messageColor]));
            outputFormattedLog(message.toUpperCase(), getCommandLineFormat([messageType, messageColor]));
            outputFormattedLog(lineText, getCommandLineFormat([messageType, messageColor]));
            break;
        case commandLineFormats.subHeading:
            outputFormattedLog(message, getCommandLineFormat([messageType, messageColor]));
            outputFormattedLog(lineText, getCommandLineFormat([messageType, messageColor]));
            break;
        case commandLineFormats.default:
            outputFormattedLog(message, getCommandLineFormat([messageType, messageColor]));
            break;
        case commandLineFormats.terminal:
            outputFormattedLog(": " + message + " ", getCommandLineFormat([messageType, messageColor]));
            break;
        default:
            outputFormattedLog(message, getCommandLineFormat([messageType, messageColor]));
    }
};

/**
 * A wrapper function for printing a message to the console, formatted as an error
 * @param {string} message The message to print to the console
 */
export const printErrorMessage = (message = "") => {
    printFormattedMessage(message, commandLineFormats.default, commandLineFormats.danger);
};

/**
 * A wrapper function for printing a message to the console, formatted as a warning
 * @param {string} message The message to print to the console
 */
export const printWarningMessage = (message = "") => {
    printFormattedMessage(message, commandLineFormats.default, commandLineFormats.warning);
};

/**
 * A wrapper function for printing a message to the console, formatted as a general info message
 * @param {string} message The message to print to the console
 */
export const printInfoMessage = (message = "") => {
    printFormattedMessage(message, commandLineFormats.default, commandLineFormats.info);
};

/**
 * A wrapper function for printing a message to the console, formatted as a success message
 * @param {string} message The message to print to the console
 */
export const printSuccessMessage = (message = "") => {
    printFormattedMessage(message, commandLineFormats.default, commandLineFormats.success);
};

/**
 * A wrapper function for printing a message to the console, formatted as a heading
 * @param {string} message The message to print to the console
 */
export const printHeadingMessage = (message = "") => {
    printFormattedMessage(message, commandLineFormats.heading, commandLineFormats.primary);
};

/**
 * A wrapper function for printing a message to the console, formatted as a sub heading
 * @param {string} message The message to print to the console
 */
export const printSubHeadingMessage = (message = "") => {
    printFormattedMessage(message, commandLineFormats.subHeading, commandLineFormats.secondary);
};

/**
 * A wrapper function for printing a message to the console, formatted as a terminal command
 * @param {string} message The message to print to the console
 */
export const printTerminalMessage = (message = "") => {
    printFormattedMessage(message, commandLineFormats.terminal, commandLineFormats.terminal);
};
