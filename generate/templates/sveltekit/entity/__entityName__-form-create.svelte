<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';

	__relatedEntitiesOptions__;
	const placeOptions = $page.data?.placeOptions ?? [];
	const parentOrganisationOptions = $page.data?.parentOrganisationOptions ?? [];

	__formValues__;
	const formValues = {
		id: $page?.data?.__entityName__?.id ?? $page?.form?.id ?? '',

		//loop over all attributes and add as below - either simple or select version
		// default basic attribute
		__attributeName__:
			$page?.data?.__entityName__?.__attributeName__ ??
			$page?.form?.__attributeName__ ??
			__attributeNameDefaultValue__,

		// example of attribute that needs toString() for selects
		isDefault:
			$page?.data?.organisation?.isDefault?.toString() ??
			$page?.form?.isDefault?.toString() ??
			'null',

		// loop over all relationships and add as below
		placeId:
			$page?.data?.organisation?.placeId?.toString() ?? $page?.form?.placeId?.toString() ?? 'null'
	};
</script>

<a href="/__entityName__/overview">back</a>
<form method="POST" action="/__entityName__/new?/create" use:enhance>
	__formValueComponents__
	<!-- Loop over each key in formValues object - based on UI config - display input|select|textarea with correct params -->

	<!-- Example: Replace with select component -->
	<label>
		Place:

		<select name="placeId" value={formValues.placeId}>
			<option value="null">-Please Select-</option>
			{#each placeOptions as placeOption}
				<option value={placeOption.id}>{placeOption.placeName}</option>
			{/each}
		</select>
	</label>
	<button>Create</button>
</form>
