// export const ssr = false;

import { listPlaces } from '$lib/data-model/place/place.server';
import { isNumeric, isValidObject } from 'dx-utilities';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ url, params }) => {
	const urlSearchParams = new URLSearchParams(url.urlSearchParams);

	const constraints = {};
	if (urlSearchParams.hasOwnProperty('limit') && isNumeric(urlSearchParams.limit)) {
		constraints.limit = parseInt(urlSearchParams.limit.toString());
	}

	if (urlSearchParams.hasOwnProperty('offset') && isNumeric(urlSearchParams.offset)) {
		constraints.offset = parseInt(urlSearchParams.offset.toString());
	}

	if (urlSearchParams.hasOwnProperty('sort') && isValidObject(urlSearchParams.sort)) {
		constraints.sort = urlSearchParams.sort;
	}

	if (urlSearchParams.hasOwnProperty('filter') && isValidObject(urlSearchParams.filter)) {
		constraints.filter = urlSearchParams.filter;
	}

	return await listPlaces(constraints);
};
