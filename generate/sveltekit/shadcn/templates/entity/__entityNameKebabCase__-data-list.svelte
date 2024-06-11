<script>
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";

    import { Input } from "__componentsPathAlias__/ui/input";
    import { Button } from "__componentsPathAlias__/ui/button";
    import { Label } from "__componentsPathAlias__/ui/label";

    import DataListRow__entityNamePascalCase__ from "__componentsPathAlias__/data-model/__entityNameKebabCase__/data-series/__entityNameKebabCase__-data-list-row.svelte";

    export let basePath = "/__entityNameKebabCase__";
    export let data;

    let limit = parseInt($page.url.searchParams.get("limit") ?? "2");
    if (!limit) limit = 2;

    let search = $page.url.searchParams.get("search");
    if (!search) search = "";

    let offset = parseInt($page.url.searchParams.get("offset") ?? "0");
    if (!offset) offset = 0;

    const handleSearchChange = () => {
        let newSearchParams = new URLSearchParams($page.url.searchParams.toString());
        newSearchParams.set("search", search);
        goto(`${basePath}/overview?${newSearchParams.toString()}`, {
            invalidateAll: true
        });
    };

    const handleSearchClear = () => {
        search = "";
        let newSearchParams = new URLSearchParams($page.url.searchParams.toString());
        newSearchParams.delete("search");
        goto(`${basePath}/overview?${newSearchParams.toString()}`, {
            invalidateAll: true
        });
    };
    const handleLimitChange = () => {
        let newSearchParams = new URLSearchParams($page.url.searchParams.toString());
        newSearchParams.set("limit", limit.toString());
        goto(`${basePath}/overview?${newSearchParams.toString()}`, {
            invalidateAll: true
        });
    };
    const handleLimitClear = () => {
        limit = 10;
        let newSearchParams = new URLSearchParams($page.url.searchParams.toString());
        newSearchParams.set("limit", limit.toString());
        goto(`${basePath}/overview?${newSearchParams.toString()}`, {
            invalidateAll: true
        });
    };

    const handleLoadMore = () => {
        let newSearchParams = new URLSearchParams($page.url.searchParams.toString());
        limit = limit + 2;
        newSearchParams.set("limit", limit.toString());
        goto(`${basePath}/overview?${newSearchParams.toString()}`, {
            invalidateAll: true
        });
    };



	const handleResetAll = async () => {
		await goto(`${basePath}/overview`, { invalidateAll: true, replaceState: true });
	}
</script>

<div class="flex w-full flex-col">
    <Label for="search">
        Search
        <div class="flex flex-row gap-2">
            <Input type="text" bind:value={search} on:change={handleSearchChange} />
            <Button on:click={handleSearchClear}>Clear</Button>
        </div>
    </Label>

    <Label for="limit">
        Limit
        <div class="flex flex-row gap-2">
            <Input type="number" bind:value={limit} on:change={handleLimitChange} />
            <Button on:click={handleLimitClear}>Reset</Button>
        </div>
    </Label>

    <Button variant="link" class="self-center"on:click={handleResetAll}>Reset All</Button>

    <div class="w-full divide-y overflow-hidden rounded-lg border">
        {#each data.__entityName__Array as __entityName__Data}
            <DataListRow__entityNamePascalCase__ {__entityName__Data} />
        {/each}
    </div>

    <Button variant="link" class="self-center" on:click={handleLoadMore}>Load More</Button>
</div>
