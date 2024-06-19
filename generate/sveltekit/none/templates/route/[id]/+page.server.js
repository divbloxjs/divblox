import { getIntId, getRefererFromRequest } from "__uiComponentsPathAlias__/data-model/_helpers/helpers";
import { getRequestBody } from "__uiComponentsPathAlias__/data-model/_helpers/helpers.server";
import { fail, redirect } from "@sveltejs/kit";

import {
    create__entityNamePascalCase__,
    delete__entityNamePascalCase__,
    load__entityNamePascalCase__,
    update__entityNamePascalCase__,
    get__entityNamePascalCase__RelationshipData,
} from "__uiComponentsPathAlias__/data-model/__entityName__/__entityName__.server";

let redirectPath = "/__entityName__";

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ params, request }) => {
    redirectPath = getRefererFromRequest(request, redirectPath);

    if (params?.id.toLowerCase() === "new") {
        const relationshipData = await get__entityNamePascalCase__RelationshipData();
        return { ...relationshipData };
    }

    const __entityName__Data = await load__entityNamePascalCase__(params?.id);
    return { ...__entityName__Data };
};

/** @type {import('./$types').Actions} */
export const actions = {
    create: async (data) => {
        const requestBody = await getRequestBody(data, "__entityName__");

        const result = await create__entityNamePascalCase__(requestBody);

        if (!result) return fail(400, requestBody);

        redirect(302, redirectPath);
    },
    update: async (data) => {
        const requestBody = await getRequestBody(data, "__entityName__");

        const result = await update__entityNamePascalCase__(requestBody);

        if (!result) return fail(400, requestBody);

        redirect(302, redirectPath);
    },
    delete: async (data) => {
        const requestBody = await getRequestBody(data, "__entityName__");

        const result = await delete__entityNamePascalCase__(getIntId(data.params?.id));

        if (!result) return fail(400, requestBody);

        redirect(302, redirectPath);
    },
};
