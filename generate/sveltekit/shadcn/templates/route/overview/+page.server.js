// export const ssr = false;

import { load__entityNamePascalCase__Array } from "__componentsPathAlias__/data-model/__entityName__/__entityName__.server";
import { isNumeric, isValidObject } from "dx-utilities";
import { parse } from "qs";

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ url, params }) => {
    const urlSearchParams = parse(url.search, { ignoreQueryPrefix: true });

    const constraints = {};

    if (urlSearchParams.hasOwnProperty("search")) {
        constraints.search = urlSearchParams.search;
    }

    if (urlSearchParams.hasOwnProperty("limit") && isNumeric(urlSearchParams.limit)) {
        constraints.limit = parseInt(urlSearchParams.limit.toString());
    }

    if (urlSearchParams.hasOwnProperty("offset") && isNumeric(urlSearchParams.offset)) {
        constraints.offset = parseInt(urlSearchParams.offset.toString());
    }

    if (urlSearchParams.hasOwnProperty("sort") && isValidObject(urlSearchParams.sort)) {
        constraints.sort = urlSearchParams.sort;
    }

    if (urlSearchParams.hasOwnProperty("filter") && isValidObject(urlSearchParams.filter)) {
        constraints.filter = urlSearchParams.filter;
    }

    return await load__entityNamePascalCase__Array(constraints);
};
