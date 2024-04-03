<script>
	import DataListOrganisation from '$lib/data-model/organisation/organisation-data-list.svelte';
	import DataTableOrganisation from '$lib/data-model/organisation/organisation-data-table.svelte';

	export let data;
	export let form;

	export let displayType = '';
	export let list = false;

	let viewportWidth = 700;

	$: list = viewportWidth < 600;
</script>

<svelte:window bind:innerWidth={viewportWidth} />
{#if list}
	<DataListOrganisation {data}></DataListOrganisation>
{:else}
	<DataTableOrganisation {data} allowDelete={true} allowEdit={true}></DataTableOrganisation>
{/if}
