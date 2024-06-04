<script>
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";

    import { parse, stringify } from "qs";

    import dataTableConfig from "./data-series/__entityNameKebabCase__-data-table.config.json";

    import { buildAttributeMap, flattenRowObject } from "__componentsPathAlias__/data-model/_helpers/helpers";
    import { Button, buttonVariants } from "__componentsPathAlias__/ui/button";
    import { Input } from "__componentsPathAlias__/ui/input";
    import { Pencil, X } from "lucide-svelte";

    let limit = parseInt($page.url.searchParams.get("limit") ?? "20");
    if (!limit) limit = 20;

    let search = $page.url.searchParams.get("search");
    if (!search) search = "";

    let offset = parseInt($page.url.searchParams.get("offset") ?? "0");
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

<div class="flex flex-row justify-between p-2">
    <div class="flex flex-col">
        <div class="flex flex-row gap-2">
            <Input
                type="text"
                bind:value={search}
                name="search"
                placeholder="Search..."
                on:change={() => {
                    let newSearchParams = new URLSearchParams($page.url.searchParams.toString());
                    newSearchParams.set("search", search);
                    goto(`/__entityName__/overview?${newSearchParams.toString()}`, {
                        keepFocus: true
                    });
                }}>
            </Input>
            <Button
                size="sm"
                on:click={() => {
                    search = "";

                    let newSearchParams = new URLSearchParams($page.url.searchParams.toString());
                    newSearchParams.delete("search");
                    goto(`/__entityName__/overview?${newSearchParams.toString()}`, {
                        keepFocus: true
                    });
                }}>Clear</Button>
        </div>
    </div>
    {#if allowCreate}
        <a href="/__entityName__/new" class={buttonVariants({ variant: "default", size: "sm" })}>New</a>
    {/if}
</div>

<table class="w-full table-auto border">
    <tr class="child:border-b child:border-l child:p-2 child:font-bold">
        {#each Object.values(attributeMap) as { displayName }}
            <th class="text-left">{displayName}</th>
        {/each}
        {#if allowDelete || allowEdit}
            <th colspan="2">Actions</th>
        {/if}
    </tr>

    <tr>
        {#each Object.values(attributeMap) as { displayName, stack, attributeName }}
            <th class="border-b p-2 text-left">
                <div class="flex">
                    <Input
                        type="text"
                        name={displayName}
                        placeholder="Filter..."
                        bind:value={filters[displayName]}
                        on:change={() => {
                            const originalParams = parse($page.url.search, { ignoreQueryPrefix: true });

                            if (!originalParams.filter) originalParams.filter = {};

                            if (!originalParams.filter[attributeName]) {
                                originalParams.filter[attributeName] = { like: filters[displayName] };
                            }

                            const newParams = stringify(originalParams, { encodeValuesOnly: true });

                            goto(`/__entityName__/overview?${newParams}`, {
                                keepFocus: true
                            });
                        }} />
                    <Button
                        size="sm"
                        on:click={() => {
                            filters[displayName] = "";
                            const originalParams = parse($page.url.search, { ignoreQueryPrefix: true });

                            delete originalParams.filter?.[attributeName];
                            const newParams = stringify(originalParams, { encodeValuesOnly: true });
                            goto(`/__entityName__/overview?${newParams}`, {
                                invalidateAll: true
                            });
                        }}>Reset</Button>
                </div>
            </th>
        {/each}
    </tr>
    {#each flatRows as flatRow, index}
        <tr class="child:p-2 odd:bg-gray-100 hover:bg-gray-200">
            {#each Object.values(flatRow) as { value, type }}
                <td class="border-r">{value}</td>
            {/each}
            {#if allowEdit || allowDelete}
                <td class="flex items-center justify-center text-center">
                    <a
                        href="/__entityName__/{data?.__entityName__Array[index]?.id}"
                        class="bg-tranparent hover:slate-800 border border-none border-slate-600 text-slate-600">
                        <Pencil class="h-4 w-4" /></a>
                    <form action="/__entityName__/{data?.__entityName__Array[index]?.id}?/delete" method="POST">
                        <Button type="submit" class="border-none" variant="destructive-outline" size="inline-icon">
                            <X class="h-4 w-4" /></Button>
                    </form>
                </td>
            {/if}
        </tr>
    {/each}
</table>

<div class="flex w-full flex-row justify-between p-2">
    <div class="flex flex-row gap-2">
        <Input
            name="limit"
            type="number"
            placeholder="Items per Page"
            bind:value={limit}
            on:change={() => {
                let newSearchParams = new URLSearchParams($page.url.searchParams.toString());
                newSearchParams.set("limit", limit.toString());
                goto(`/__entityName__/overview?${newSearchParams.toString()}`, {
                    invalidateAll: true
                });
            }} />
        <Button
            size="sm"
            on:click={() => {
                limit = 10;
                let newSearchParams = new URLSearchParams($page.url.searchParams.toString());
                newSearchParams.set("limit", limit.toString());
                goto(`/__entityName__/overview?${newSearchParams.toString()}`, {
                    invalidateAll: true
                });
            }}>Reset</Button>
    </div>
    <div>
        <Button
            size="sm"
            on:click={() => {
                let newSearchParams = new URLSearchParams($page.url.searchParams.toString());
                offset = offset - limit <= 0 ? 0 : offset - limit;
                newSearchParams.set("offset", offset.toString());
                goto(`/__entityName__/overview?${newSearchParams.toString()}`, {
                    invalidateAll: true
                });
            }}>
            Prev
        </Button>
        <Button
            size="sm"
            on:click={() => {
                let newSearchParams = new URLSearchParams($page.url.searchParams.toString());
                offset = offset + limit;
                newSearchParams.set("offset", offset.toString());
                goto(`/__entityName__/overview?${newSearchParams.toString()}`, {
                    invalidateAll: true
                });
            }}>
            Next
        </Button>
    </div>
</div>
