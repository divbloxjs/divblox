import { prisma } from '$lib/server/prisma-instance';
import { isNumeric } from 'dx-utilities';
import {
	getEntitiesRelatedTo,
	getIntId,
	getRelatedEntities,
	normalizeDatabaseArray
} from '../_helpers/helpers';
import { getPrismaSelectAllFromEntity, getPrismaConditions } from '$lib/server/prisma.helpers';

//TODO Recursive
const searchConfig = {
	attributes: ['organisationName'],
	relationships: {
		parentOrganisation: { attributes: ['organisationName'] }
	}
};

// GENERATE entire thing based on data model - fully exhaustive
export const listOrganisations = async (constraints = {}) => {
	const selectClause = getPrismaSelectAllFromEntity('organisation');
	const prismaConditions = getPrismaConditions('organisation', searchConfig, constraints);

	const organisations = await prisma.organisation.findMany({
		// relationLoadStrategy: 'join', // or "query"
		select: selectClause,
		...prismaConditions
	});

	try {
		normalizeDatabaseArray(organisations);
	} catch (err) {
		console.error(err);
	}

	return { organisations };
};

export const createOrganisation = async (data) => {
	data.isDefault = parseInt(data.isDefault);

	try {
		await prisma.organisation.create({ data });
		return true;
	} catch (err) {
		console.error(err);
		return false;
	}
};

export const updateOrganisation = async (data) => {
	const relationships = getRelatedEntities('organisation');
	console.log(Object.values(relationships));
	Object.values(relationships).forEach((relationshipName) => {
		if (data.hasOwnProperty(relationshipName)) {
			if (!isNumeric(data[relationshipName])) {
				delete data[relationshipName];
			} else {
				data[relationshipName] = null;
			}
		}
	});

	data.isDefault = parseInt(data.isDefault);

	try {
		const result = await prisma.organisation.update({
			data,
			where: { id: data.id }
		});
		return true;
	} catch (err) {
		console.error(err);
		return false;
	}
};

export const deleteOrganisation = async (id = -1) => {
	try {
		await prisma.organisation.delete({ where: { id } });
		return true;
	} catch (err) {
		console.error(err);
		return false;
	}
};

export const loadOrganisation = async (id = -1, relationshipOptions = true) => {
	let organisation = await prisma.organisation.findUnique({
		where: { id: id }
	});

	organisation = {
		...organisation,
		id: getIntId(organisation.id),
		placeId: getIntId(organisation.placeId),
		parentOrganisationId: getIntId(organisation.parentOrganisationId)
	};
	const returnObject = { organisation };

	if (!relationshipOptions) return returnObject;

	for (const [relatedEntityName, relationshipNames] of Object.entries(
		getRelatedEntities('organisation')
	)) {
		const relationshipData = await prisma[relatedEntityName].findMany({
			take: 50
		});

		returnObject[`${relatedEntityName}Options`] = relationshipData.map((relationship) => {
			relationship.id = relationship.id.toString();
			return relationship;
		});
	}

	for (const entityName of getEntitiesRelatedTo('organisation')) {
		// const relationshipData = await prisma[entityName].findMany({
		// 	where: { organisationId: id },
		// 	take: 50
		// });

		if (!returnObject?.associatedEntities) {
			returnObject.associatedEntities = {};
		}

		// const relationshipData = await listCustomers();
		const relationshipData = await prisma.customer.findMany({
			where: { organisationId: id }
		});

		returnObject.associatedEntities[entityName] = relationshipData.map((relationship) => {
			// returnObject.associatedEntities[entityName] = relationshipData.customers.map((relationship) => {
			relationship.id = relationship.id.toString();
			return relationship;
		});
	}

	console.log('returnObject', returnObject);
	return returnObject;
};
