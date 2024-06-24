<script>
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";

    import { Input } from "__uiComponentsPathAlias__/ui/input";
    import { Button } from "__uiComponentsPathAlias__/ui/button";
    import { Label } from "__uiComponentsPathAlias__/ui/label";

    import DataListRow__entityNamePascalCase__ from "__dataModelComponentsPathAlias__/__entityNameKebabCase__/data-series/__entityNameKebabCase__-data-list-row.svelte";

    export let basePath = "/__entityNameKebabCase__";
    export let data;

    export let defaultSearch = "";
    export let paginateSize = 2;

    let search = defaultSearch;
    let limit = data.__entityName__Array.length;

    if ($page.url.searchParams.get("limit"))
        limit = parseInt($page.url.searchParams.get("limit") ?? data.__entityName__Array.length.toString());
    if ($page.url.searchParams.get("search")) search = $page.url.searchParams.get("search") ?? "";

    const handleSearchChange = () => {
        let newSearchParams = new URLSearchParams($page.url.searchParams.toString());
        newSearchParams.set("search", search);
        goto(`?${newSearchParams.toString()}`);
    };

    const handleSearchClear = () => {
        search = "";
        let newSearchParams = new URLSearchParams($page.url.searchParams.toString());
        newSearchParams.delete("search");
        goto(`?${newSearchParams.toString()}`);
    };

    const handleLoadMore = () => {
        let newSearchParams = new URLSearchParams($page.url.searchParams.toString());
        limit = limit + paginateSize;
        newSearchParams.set("limit", limit.toString());
        goto(`?${newSearchParams.toString()}`);
    };
</script>

<div class="flex w-full flex-col gap-2">
    <Label for="search">Search</Label>
    <div class="flex flex-row gap-2">
        <Input class="h-9" type="text" bind:value={search} on:change={handleSearchChange} />
        <Button size="sm" on:click={handleSearchClear}>Clear</Button>
    </div>

    <div class="w-full divide-y overflow-hidden rounded-lg border">
        {#each data.__entityName__Array as __entityName__Data}
            <DataListRow__entityNamePascalCase__ {__entityName__Data} {basePath} />
        {/each}
    </div>

    {#if data?.__entityName__TotalCount > limit}
        <Button variant="link" size="sm" class="self-center" on:click={handleLoadMore}>Load More</Button>
    {/if}
</div>
