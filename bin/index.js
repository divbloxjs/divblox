#! /usr/bin/env node
import { defaultFunction, doSomething } from "../index.js";

if (process.argv.length < 3) {
    defaultFunction();
    process.exit(0);
}

doSomething();
