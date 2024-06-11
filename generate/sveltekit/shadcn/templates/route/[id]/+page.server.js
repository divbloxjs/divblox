import { fail } from "@sveltejs/kit";
import { prisma } from "$lib/server/prisma-instance";
import { message, superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import {
    __entityName__CreateSchema,
    __entityName__UpdateSchema,
} from "__componentsPathAlias__/data-model/__entityNameKebabCase__/__entityNameKebabCase__.schema";

import {
    load__entityNamePascalCase__,
    get__entityNamePascalCase__RelationshipData,
    update__entityNamePascalCase__,
} from "__componentsPathAlias__/data-model/__entityNameKebabCase__/__entityNameKebabCase__.server";

/** @type {import('./$types').PageServerLoad} */
export const load = async (event) => {
    const { params } = event;

    let form;
    if (params?.id.toLowerCase() === "new") {
        form = await superValidate(event, zod(__entityName__CreateSchema));
        const relationshipData = await get__entityNamePascalCase__RelationshipData();
        return { form, ...relationshipData };
    } else {
        form = await superValidate(event, zod(__entityName__UpdateSchema));
    }

    const __entityName__Data = await load__entityNamePascalCase__(params?.id);

    form.data = { ...__entityName__Data.__entityName__ };

    return { form, ...__entityName__Data };
};

/** @type {import('./$types').Actions} */
export const actions = {
    create: async (event) => {
        const form = await superValidate(event, zod(__entityName__CreateSchema));

        if (!form.valid) return fail(400, { form });

        try {
            await prisma.__entityNameSqlCase__.create({ data: form.data });
        } catch (error) {
            console.error(error);
            return message(form, "Something went wrong. Please try again");
        }
    },
    update: async (event) => {
        const form = await superValidate(event, zod(__entityName__UpdateSchema));

        if (!form.valid) return fail(400, { form });

        const result = await update__entityNamePascalCase__(form.data);
        if (!result) return message(form, "Bad!");

        return { form, message: "Updated successfully!" };
    },
    delete: async (event) => {
        await prisma.__entityNameSqlCase__.delete({ where: { id: event.params?.id } });
    },
};
