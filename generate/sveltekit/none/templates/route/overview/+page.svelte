<script>
    import DataList__entityNamePascalCase__ from "__uiComponentsPathAlias__/data-model/user-account/user-account-data-list.svelte";
    import DataTable__entityNamePascalCase__ from "__uiComponentsPathAlias__/data-model/user-account/user-account-data-table.svelte";

    export let data;

    let containerWidth = 0;
    $: renderAsList = containerWidth < 700;
</script>

<div class="flex w-full flex-col" bind:clientWidth={containerWidth}>
    {#if renderAsList}
        <DataList__entityNamePascalCase__ {data} />
    {:else}
        <DataTable__entityNamePascalCase__ {data} allowDelete={true} allowEdit={true} />
    {/if}
</div>
