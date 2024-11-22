<script>
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";

    import dataTableConfig from "./data-series/__entityNameKebabCase__-data-table.config.json";
    import { buildAttributeMap, flattenRowObject } from "__dataModelComponentsPathAlias__/_helpers/helpers";

    import X from "lucide-svelte/icons/x";
    
    import { Button, buttonVariants } from "__uiComponentsPathAlias__/ui/button";
    import { Input } from "__uiComponentsPathAlias__/ui/input";
    import { Label } from "__uiComponentsPathAlias__/ui/label";

    import FilterInput from "__dataModelComponentsPathAlias__/_partial-components/data-series/filter-inputs/_filter-input.svelte";
    import __entityNamePascalCase__DataTableRow from "./data-series/__entityNameKebabCase__-data-table-row.svelte";
    import { Plus } from "lucide-svelte";

    let limit = parseInt($page.url.searchParams.get("limit") ?? "20");
    if (!limit) limit = 20;

    let search = $page.url.searchParams.get("search");
    if (!search) search = "";

    let offset = parseInt($page.url.searchParams.get("offset") ?? "0");
    if (!offset) offset = 0;

    export let allowEdit = true;
    export let allowDelete = true;
    export let allowCreate = true;

    export let basePath = "/__entityNameKebabCase__";

    export let data;

    let attributeMap = {};
    buildAttributeMap("__entityName__", dataTableConfig, attributeMap);

    let flatRows = [];
    $: (() => {
        flatRows = [];
        for (const nestedRow of data.__entityName__Array) {
            flatRows.push(flattenRowObject(nestedRow, attributeMap));
        }
    })();

    //#region Search
    const handleSearchChange = () => {
        let newSearchParams = new URLSearchParams($page.url.searchParams.toString());
        newSearchParams.set("search", search);
        goto(`${basePath}?${newSearchParams.toString()}`, {
            keepFocus: true
        });
    };

    const handleSearchClear = () => {
        search = "";

        let newSearchParams = new URLSearchParams($page.url.searchParams.toString());
        newSearchParams.delete("search");
        goto(`${basePath}?${newSearchParams.toString()}`, {
            keepFocus: true
        });
    };
    //#endregion

    //#region Pagination
    const handlePaginationPrev = () => {
        let newSearchParams = new URLSearchParams($page.url.searchParams.toString());
        offset = parseInt(offset) - parseInt(limit) <= 0 ? 0 : parseInt(offset) - parseInt(limit);
        newSearchParams.set("offset", offset.toString());
        goto(`${basePath}?${newSearchParams.toString()}`, {
            invalidateAll: true
        });
    };

    const handlePaginationNext = () => {
        let newSearchParams = new URLSearchParams($page.url.searchParams.toString());
        offset = offset + limit;
        newSearchParams.set("offset", offset.toString());
        goto(`${basePath}?${newSearchParams.toString()}`, {
            invalidateAll: true
        });
    };
    //#endregion

    const handleLimitChange = () => {
        let newSearchParams = new URLSearchParams($page.url.searchParams.toString());
        newSearchParams.set("limit", limit.toString());
        goto(`${basePath}?${newSearchParams.toString()}`, {
            invalidateAll: true
        });
    };
</script>

<div class="mb-2 flex flex-row justify-between">
    <div class="flex flex-col">
        <div class="flex flex-row gap-2">
            <Input type="text" bind:value={search} name="search" placeholder="Search..." on:change={handleSearchChange}></Input>
            <Button variant="link" size="sm" class="px-0" on:click={handleSearchClear}><X/></Button>
        </div>
    </div>
    {#if allowCreate}
        <a href={`${basePath}/new`} class={buttonVariants({ variant: "default", size: "sm" })}><Plus/></a>
    {/if}
</div>

<div class="w-full overflow-x-auto">
    <table class="w-full table-auto border">
        <tr class="child:border-b child:border-l child:p-2 child:font-bold">
            {#each Object.values(attributeMap) as { displayName }}
                <th class="min-w-48 max-w-56 text-left">{displayName}</th>
            {/each}
            {#if allowDelete || allowEdit}
                <th colspan="2">Actions</th>
            {/if}
        </tr>

        <tr class="last:border-l child:border-b child:border-r">
            {#each Object.values(attributeMap) as { entityName, displayName, stack, attributeName }}
                <th class="p-2 text-left">
                    <div class="flex items-center">
                        <FilterInput
                            {entityName}
                            {basePath}
                            {attributeName}
                            {displayName}
                            options={data.enums?.[entityName]?.[attributeName] ?? []} />
                    </div>
                </th>
            {/each}
        </tr>
        {#each flatRows as flatRow, index}
            <__entityNamePascalCase__DataTableRow {flatRow} rowId={data?.__entityName__Array[index]?.id} {basePath} {allowEdit} {allowDelete}/>
        {/each}
    </table>
</div>

<div class="justify-left flex w-full flex-row p-2">
    <div class="flex flex-col gap-2">
        <Label>Items per page</Label>
        <div class="flex gap-2">
            <Input type="number" name="limit" placeholder="Items per Page" bind:value={limit} on:change={handleLimitChange} />

            <div class="flex gap-2">
                <Button on:click={handlePaginationPrev}>Prev</Button>
                <Button on:click={handlePaginationNext}>Next</Button>
            </div>
        </div>
    </div>
</div>
