<script>
    import { createEventDispatcher, onMount } from "svelte";
    import { page } from "$app/stores";

    import { Input } from "__uiComponentsPathAlias__/ui/input";
    import { Button, buttonVariants } from "__uiComponentsPathAlias__/ui/button";

    import { Plus, X } from "lucide-svelte";

    import DataListRow__entityNamePascalCase__ from "__dataModelComponentsPathAlias__/__entityNameKebabCase__/data-series/__entityNameKebabCase__-data-list-row.svelte";

    export let getEntityArrayPath = "/__entityNameKebabCase__";
    export let entityInstancePath = "/__entityNameKebabCase__";
    export let redirectBackPath = $page.url.pathname;

    export let disableDefaultRowClickAction = false;

    export let defaultSearch = "";
    let search = defaultSearch;

    export let defaultLimit = 2;
    $: limit = Number(defaultLimit);

    export let paginateSize = 2;

    export let allowCreate = true;

    const dispatch = createEventDispatcher();

    let __entityName__Array = [];
    let __entityName__TotalCount = 0;
    let enums = [];

    let isInitialised = false;
    onMount(async () => {
        let newSearchParams = new URLSearchParams();
        newSearchParams.set("limit", limit.toString());

        await get__entityNamePascalCase__Array(newSearchParams);

        isInitialised = true;
    });

    const get__entityNamePascalCase__Array = async (searchParams) => {
        const response = await fetch(`${getEntityArrayPath}?${searchParams?.toString() ?? ""}`);
        const result = await response.json();

        if (!Array.isArray(result.__entityName__Array)) {
            return;
        }

        __entityName__Array = result.__entityName__Array;
        __entityName__TotalCount = result.__entityName__TotalCount;
        enums = result.enums;
    };

    const handleSearchChange = () => {
        let newSearchParams = new URLSearchParams();
        if (search) newSearchParams.set("search", search);

        limit = Number(defaultLimit);
        newSearchParams.set("limit", limit.toString());

        get__entityNamePascalCase__Array(newSearchParams);
    };

    const handleSearchClear = () => {
        search = "";
        limit = Number(defaultLimit);

        let newSearchParams = new URLSearchParams();
        if (limit) newSearchParams.set("limit", limit.toString());

        get__entityNamePascalCase__Array(newSearchParams);
    };

    const handleLoadMore = async () => {
        let offset = limit;
        limit = limit + paginateSize;

        let newSearchParams = new URLSearchParams();
        if (limit) newSearchParams.set("limit", limit.toString());
        if (offset) newSearchParams.set("offset", offset.toString());
        if (search) newSearchParams.set("search", search);

        const response = await fetch(`${getEntityArrayPath}?${newSearchParams?.toString() ?? ""}`);
        const result = await response.json();

        if (!Array.isArray(result.__entityName__Array)) {
            return;
        }

        __entityName__Array = [...__entityName__Array, ...result.__entityName__Array];
        __entityName__TotalCount = result.__entityName__TotalCount;

        enums = result.enums;
    };
</script>

<div class="flex h-full w-full flex-col gap-2">
    <div class="flex flex-row gap-2">
        <Input class="h-9" type="text" bind:value={search} placeholder="Search..." on:change={handleSearchChange} />
        <Button size="sm" variant="link" class="px-0" on:click={handleSearchClear}><X /></Button>
        {#if allowCreate}
            <a href={`${entityInstancePath}/new`} class={`${buttonVariants({ size: "sm" })}`}><Plus></Plus></a>
        {/if}
    </div>

    <div class="w-full divide-y overflow-y-auto rounded-lg border">
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
