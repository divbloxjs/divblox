<script>
    import FormCreate__entityNamePascalCase__ from "__componentsPathAlias__/data-model/__entityNameKebabCase__/__entityNameKebabCase__-form-create.svelte";
    import FormUpdate__entityNamePascalCase__ from "__componentsPathAlias__/data-model/__entityNameKebabCase__/__entityNameKebabCase__-form-update.svelte";

    import { page } from "$app/stores";

    /** @type {import('./$types').PageData} */
    export let data;
</script>

<div class="flex w-full max-w-4xl self-center">
    {#if $page.params.id === "new"}
        <FormCreate__entityNamePascalCase__ {data} />
    {:else if parseInt($page.params.id) > 0}
        <FormUpdate__entityNamePascalCase__ {data} />
    {/if}
</div>

