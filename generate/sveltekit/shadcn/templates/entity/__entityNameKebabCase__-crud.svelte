<script>
	import DataList__entityNamePascalCase__ from '__dataModelComponentsPathAlias__/__entityNameKebabCase__/__entityNameKebabCase__-data-list.svelte';
	import DataTable__entityNamePascalCase__ from '__dataModelComponentsPathAlias__/__entityNameKebabCase__/__entityNameKebabCase__-data-table.svelte';

	export let basePath = "/__entityNameKebabCase__";
	export let data;

	let viewportWidth = 700;

	$: list = viewportWidth < 600;
</script>

<svelte:window bind:innerWidth={viewportWidth} />
{#if list}
	<DataList__entityNamePascalCase__ {data} {basePath}/>
{:else}
	<DataTable__entityNamePascalCase__ {data} {basePath} allowDelete={true} allowEdit={true}/>
{/if}
