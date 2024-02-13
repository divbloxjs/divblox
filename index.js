export const defaultFunction = () => {
    console.log("Default function called with no arguments");
};

export const doSomething = () => {
    console.log("Arguments:");
    console.log(process.argv);
};
