<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	import { parse, stringify } from 'qs';

	import dataTableConfig from './data-series/__entityNameKebabCase__-data-table.config.json';

	import {
		buildAttributeMap,
		flattenRowObject
	} from '__uiComponentsPathAlias__/data-model/_helpers/helpers';

	let limit = parseInt($page.url.searchParams.get('limit') ?? '20');
	if (!limit) limit = 20;

	let search = $page.url.searchParams.get('search');
	if (!search) search = '';

	let offset = parseInt($page.url.searchParams.get('offset') ?? '0');
	if (!offset) offset = 0;

	export let allowEdit = true;
	export let allowDelete = true;
	export let allowCreate = true;

	export let data;

	let attributeMap = {};
	buildAttributeMap(dataTableConfig, attributeMap);

	let flatRows = [];
	$: (() => {
		flatRows = [];
		for (const nestedRow of data.__entityName__Array) {
			flatRows.push(flattenRowObject(nestedRow, attributeMap));
		}
	})();

	let filters = {};
</script>

<label for="search">
	Search
	<input
		type="text"
		bind:value={search}
		on:change={() => {
			let newSearchParams = new URLSearchParams($page.url.searchParams.toString());
			newSearchParams.set('search', search);
			goto(`/__entityNameKebabCase__?${newSearchParams.toString()}`, {
				keepFocus: true
			});
		}}
	/>
	<button
		on:click={() => {
			search = '';

			let newSearchParams = new URLSearchParams($page.url.searchParams.toString());
			newSearchParams.delete('search');
			goto(`/__entityNameKebabCase__?${newSearchParams.toString()}`, {
				keepFocus: true
			});
		}}>Clear</button
	>
</label>
<label for="limit">
	Limit
	<input
		type="number"
		bind:value={limit}
		on:change={() => {
			let newSearchParams = new URLSearchParams($page.url.searchParams.toString());
			newSearchParams.set('limit', limit.toString());
			goto(`/__entityNameKebabCase__?${newSearchParams.toString()}`, {
				keepFocus: true
			});
		}}
	/>
	<button
		on:click={() => {
			limit = 10;
			let newSearchParams = new URLSearchParams($page.url.searchParams.toString());
			newSearchParams.set('limit', limit.toString());
			goto(`/__entityNameKebabCase__?${newSearchParams.toString()}`, {
				keepFocus: true
			});
		}}>Reset</button
	>
</label>
<button
	on:click={() => {
		let newSearchParams = new URLSearchParams($page.url.searchParams.toString());
		offset = offset - limit <= 0 ? 0 : offset - limit;
		newSearchParams.set('offset', offset.toString());
		goto(`/__entityNameKebabCase__?${newSearchParams.toString()}`, {
			keepFocus: true
		});
	}}
>
	Prev
</button>
<button
	on:click={() => {
		let newSearchParams = new URLSearchParams($page.url.searchParams.toString());
		offset = offset + limit;
		newSearchParams.set('offset', offset.toString());
		goto(`/__entityNameKebabCase__?${newSearchParams.toString()}`, {
			keepFocus: true
		});
	}}
>
	Next
</button>

<button
	on:click={() => {
		goto(`/__entityNameKebabCase__`);
	}}>Reset All</button
>

<table style="width:100%">
	<tr>
		{#each Object.values(attributeMap) as { displayName }}
			<th>{displayName}</th>
		{/each}
		{#if allowDelete || allowEdit}
			<th colspan="2">Actions</th>
		{/if}
	</tr>

	<tr>
		{#each Object.values(attributeMap) as { displayName, stack, attributeName }}
			<th>
				<label for={displayName} style="display: flex; flex-direction:row;">
					<input
						type="text"
						bind:value={filters[displayName]}
						on:change={() => {
							const originalParams = parse($page.url.search, { ignoreQueryPrefix: true });

							if (!originalParams.filter) originalParams.filter = {};

							if (!originalParams.filter[attributeName]) {
								originalParams.filter[attributeName] = { like: filters[displayName] };
							}

							const newParams = stringify(originalParams, { encodeValuesOnly: true });

							goto(`/__entityNameKebabCase__?${newParams}`, {
								keepFocus: true
							});
						}}
					/>
					<button
						on:click={() => {
							filters[displayName] = '';
							const originalParams = parse($page.url.search, { ignoreQueryPrefix: true });

							delete originalParams.filter?.[attributeName];
							const newParams = stringify(originalParams, { encodeValuesOnly: true });
							goto(`/__entityNameKebabCase__?${newParams}`, {
								keepFocus: true
							});
						}}>Reset</button
					>
				</label>
			</th>
		{/each}
	</tr>
	{#each flatRows as flatRow, index}
		<tr>
			{#each Object.values(flatRow) as { value, type }}
				<td>{value}</td>
			{/each}
			{#if allowEdit}
				<td><a href="/__entityNameKebabCase__/{data?.__entityName__Array[index]?.id}">edit</a></td>
			{/if}
			{#if allowDelete}
				<td>
					<form action="/__entityNameKebabCase__/{data?.__entityName__Array[index]?.id}?/delete" method="POST">
						<button>delete</button>
					</form>
				</td>
			{/if}
		</tr>
	{/each}
</table>

{#if allowCreate}
	<a href="/__entityNameKebabCase__/new">New</a>
{/if}
