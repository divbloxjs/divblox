import { getIntId, getRefererFromRequest } from '$lib/data-model/_helpers/helpers';
import { getRequestBody } from '$lib/data-model/customer/customer.server';
import { fail, redirect } from '@sveltejs/kit';

import {
	createOrganisation,
	deleteOrganisation,
	loadOrganisation,
	updateOrganisation
} from '$lib/data-model/organisation/organisation.server';

let redirectPath = '/organisation/overview';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ params, request }) => {
	redirectPath = getRefererFromRequest(request, redirectPath);

	if (params?.id.toLowerCase() === 'new') {
		return {};
	}

	return await loadOrganisation(params?.id);
};

/** @type {import('./$types').Actions} */
export const actions = {
	create: async (data) => {
		const requestBody = await getRequestBody(data);

		const result = await createOrganisation(requestBody);

		if (!result) return fail(400, requestBody);

		redirect(302, redirectPath);
	},
	update: async (data) => {
		const requestBody = await getRequestBody(data);

		const result = await updateOrganisation(requestBody);

		if (!result) return fail(400, requestBody);

		redirect(302, redirectPath);
	},
	delete: async (data) => {
		const requestBody = await getRequestBody(data);

		const result = await deleteOrganisation(getIntId(data.params?.id));

		if (!result) return fail(400, requestBody);

		redirect(302, redirectPath);
	}
};
