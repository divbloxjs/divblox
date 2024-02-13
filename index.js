export const defaultFunction = () => {
    console.log("Default function called with no arguments. divblox cli version 0.0.1");
};

export const doSomething = () => {
    console.log("Arguments:");
    console.log(process.argv);
};
