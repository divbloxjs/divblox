<script>
    import { createEventDispatcher, onMount } from "svelte";
    import { page } from "$app/stores";

    import { Input } from "__uiComponentsPathAlias__/ui/input";
    import { Button } from "__uiComponentsPathAlias__/ui/button";
    import { Label } from "__uiComponentsPathAlias__/ui/label";

    import DataListRow__entityNamePascalCase__ from "__dataModelComponentsPathAlias__/__entityNameKebabCase__/data-series/__entityNameKebabCase__-data-list-row.svelte";

    export let getEntityArrayPath = "/__entityNameKebabCase__";
    export let entityInstancePath = "/__entityNameKebabCase__";
    export let redirectBackPath = $page.url.pathname;

    export let disableDefaultRowClickAction = false;

    export let defaultSearch = "";
    let search = defaultSearch;

    export let defaultLimit = 2;
    $: limit = defaultLimit;

    export let paginateSize = 2;

    const dispatch = createEventDispatcher();

    let __entityName__Array = [];
    let __entityName__TotalCount = 0;
    let enums = [];

    let isInitialised = false;
    onMount(async () => {
        await get__entityNamePascalCase__Array();
        limit = __entityNamePascalCase__Array.length;
    });

    const get__entityNamePascalCase__Array = async (searchParams) => {
        isInitialised = false;
        const response = await fetch(`${getEntityArrayPath}?${searchParams?.toString() ?? ""}`);
        const result = await response.json();

        __entityName__Array = result.__entityName__Array;
        __entityName__TotalCount = result.__entityName__TotalCount;
        enums = result.enums;

        isInitialised = true;
    };

    const handleSearchChange = () => {
        let newSearchParams = new URLSearchParams();
        if (search) newSearchParams.set("search", search);

        limit = defaultLimit;
        newSearchParams.set("limit", limit.toString());

        get__entityNamePascalCase__Array(newSearchParams);
    };

    const handleSearchClear = () => {
        search = "";
        let newSearchParams = new URLSearchParams();
        if (limit) newSearchParams.set("limit", limit.toString());

        get__entityNamePascalCase__Array(newSearchParams);
    };

    const handleLoadMore = () => {
        limit = limit + paginateSize;

        let newSearchParams = new URLSearchParams();
        if (limit) newSearchParams.set("limit", limit.toString());
        if (search) newSearchParams.set("search", search);

        get__entityNamePascalCase__Array(newSearchParams);
    };
</script>

<div class="flex w-full flex-col gap-2">
    <Label for="search">Search</Label>
    <div class="flex flex-row gap-2">
        <Input class="h-9" type="text" bind:value={search} on:change={handleSearchChange} />
        <Button size="sm" on:click={handleSearchClear}>Clear</Button>
    </div>

    <div class="max-h-96 w-full divide-y overflow-y-auto rounded-lg border">
        {#if isInitialised}
            {#each __entityName__Array as __entityName__Data}
                <DataListRow__entityNamePascalCase__ 
                    {__entityName__Data} 
                    basePath={entityInstancePath} 
                    {redirectBackPath}
                    {disableDefaultRowClickAction}
                    on:row-clicked={(event) => dispatch("row-clicked", event.detail)} />
            {/each}

            {#if __entityName__Array.length === 0}
                <button class="w-full bg-card px-2 py-4 text-center">
                    <p class="truncate">No results found</p>
                </button>
            {/if}
        {:else}
            <button class="w-full bg-card px-2 py-4 text-center">
                <p class="truncate">Loading...</p>
            </button>
        {/if}
    </div>

    {#if __entityName__TotalCount > limit}
        <Button variant="link" size="sm" class="self-center" on:click={handleLoadMore}>Load More</Button>
    {/if}
</div>
