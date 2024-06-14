<script>
	import FormCreate__entityNamePascalCase__ from '__uiComponentsPathAlias__/data-model/__entityNameKebabCase__/__entityNameKebabCase__-form-create.svelte';
	import FormUpdate__entityNamePascalCase__ from '__uiComponentsPathAlias__/data-model/__entityNameKebabCase__/__entityNameKebabCase__-form-update.svelte';

	import { page } from '$app/stores';

	/** @type {import('./$types').PageData} */
	export let data;

	export let form;
</script>

{#if $page.params.id === 'new'}
	<FormCreate__entityNamePascalCase__ />
{:else if parseInt($page.params.id) > 0}
	<FormUpdate__entityNamePascalCase__ />
{/if}
