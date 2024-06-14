<script>
	import DataList__entityNamePascalCase__ from '__uiComponentsPathAlias__/data-model/__entityName__/__entityName__-data-list.svelte';
	import DataTable__entityNamePascalCase__ from '__uiComponentsPathAlias__/data-model/__entityName__/__entityName__-data-table.svelte';

	export let data;
	export let form;

	export let displayAsList = false;

	let viewportWidth = 700;

	$: displayAsList = viewportWidth < 600;
</script>

<svelte:window bind:innerWidth={viewportWidth} />

{#if displayAsList}
	<DataList__entityNamePascalCase__ {data}/>
{:else}
	<DataTable__entityNamePascalCase__ {data} allowDelete={true} allowEdit={true}/>
{/if}
