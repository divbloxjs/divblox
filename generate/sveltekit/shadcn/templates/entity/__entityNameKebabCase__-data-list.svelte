<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	import DataListRow__entityNamePascalCase__ from '__componentsPathAlias__/data-model/__entityNameKebabCase__/data-series/__entityNameKebabCase__-data-list-row.svelte';
	import { Input } from '__componentsPathAlias__/ui/input';

	let limit = parseInt($page.url.searchParams.get('limit') ?? '2');
	if (!limit) limit = 2;
	let search = $page.url.searchParams.get('search');
	if (!search) search = '';

	let offset = parseInt($page.url.searchParams.get('offset') ?? '0');
	if (!offset) offset = 0;
	export let data;
</script>

<label for="search">
	Search
	<Input
		type="text"
		bind:value={search}
		on:change={() => {
			let newSearchParams = new URLSearchParams($page.url.searchParams.toString());
			newSearchParams.set('search', search);
			goto(`/__entityName__/overview?${newSearchParams.toString()}`, {
				invalidateAll: true
			});
		}}
	/>
	<button
		on:click={() => {
			search = '';
			let newSearchParams = new URLSearchParams($page.url.searchParams.toString());
			newSearchParams.delete('search');
			goto(`/__entityName__/overview?${newSearchParams.toString()}`, {
				invalidateAll: true
			});
		}}>Clear</button
	>
</label>

<br />

<label for="limit">
	Limit
	<input
		type="number"
		bind:value={limit}
		on:change={() => {
			let newSearchParams = new URLSearchParams($page.url.searchParams.toString());
			newSearchParams.set('limit', limit.toString());
			goto(`/__entityName__/overview?${newSearchParams.toString()}`, {
				invalidateAll: true
			});
		}}
	/>
	<button
		on:click={() => {
			limit = 10;
			let newSearchParams = new URLSearchParams($page.url.searchParams.toString());
			newSearchParams.set('limit', limit.toString());
			goto(`/__entityName__/overview?${newSearchParams.toString()}`, {
				invalidateAll: true
			});
		}}>Reset</button
	>
</label>

<button
	on:click={() => {
		let newSearchParams = new URLSearchParams($page.url.searchParams.toString());
		limit = limit + 2;
		newSearchParams.set('limit', limit.toString());
		goto(`/__entityName__/overview?${newSearchParams.toString()}`, {
			invalidateAll: true
		});
	}}
>
	Load More
</button>

<br />

<button
	on:click={() => {
		goto(`/__entityName__/overview`);
	}}
>
	Reset All
</button>

{#each data.__entityName__Array as __entityName__Data}
	<DataListRow__entityNamePascalCase__ {__entityName__Data} />
{/each}
