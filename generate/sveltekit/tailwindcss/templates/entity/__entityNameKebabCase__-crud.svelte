<script>
	import DataList__entityNamePascalCase__ from '__uiComponentsPathAlias__/data-model/__entityNameKebabCase__/__entityNameKebabCase__-data-list.svelte';
	import DataTable__entityNamePascalCase__ from '__uiComponentsPathAlias__/data-model/__entityNameKebabCase__/__entityNameKebabCase__-data-table.svelte';

	export let data;
	export let form;

	export let displayType = '';
	export let list = false;

	let viewportWidth = 700;

	$: list = viewportWidth < 600;
</script>

<svelte:window bind:innerWidth={viewportWidth} />
{#if list}
	<DataList__entityNamePascalCase__ {data} />
{:else}
	<DataTable__entityNamePascalCase__ {data} allowDelete={true} allowEdit={true} />
{/if}
