<script>
	import CreateForm from '$lib/data-model/place/form-create.svelte';
	import UpdateForm from '$lib/data-model/place/form-update.svelte';

	import { page } from '$app/stores';

	/** @type {import('./$types').PageData} */
	export let data;

	export let form;
</script>

{#if $page.params.id === 'new'}
	<CreateForm />
{:else if $page.params.id > 0}
	<UpdateForm />
{/if}
