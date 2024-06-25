<script>
    import dataModelUi from "datamodel-ui";

    import FilterText from "./filter-text.svelte";
    import FilterNumber from "./filter-number.svelte";
    import FilterSelect from "./filter-select.svelte";
    import FilterDate from "./filter-date.svelte";
    import FilterDatetime from "./filter-datetime.svelte";
    import FilterEnum from "./filter-enum.svelte";
    import FilterCheckbox from "./filter-checkbox.svelte";

    import { getCamelFromSqlCase } from "$lib/helpers.js";
    import { parse, stringify } from "qs";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";

    export let entityName = "userAccount";
    export let attributeName = "name";

    export let displayName;
    export let basePath;
    export let options = [];

    $: type = dataModelUi[getCamelFromSqlCase(entityName)][getCamelFromSqlCase(attributeName)]?.type;

    $: filterValue = Object.values(
        parse($page.url.search, { ignoreQueryPrefix: true })?.filter?.[entityName]?.[attributeName] ?? { key: "" }
    )[0];

    //#region Filter handlers
    const handleFilterChange = ({ detail }) => {
        const newFilterValue = detail.filterValue;
        const newFilterComparison = detail.filterComparison;
        const originalParams = parse($page.url.search, { ignoreQueryPrefix: true });

        if (!originalParams.filter) originalParams.filter = {};
        if (!originalParams.filter[entityName]) originalParams.filter[entityName] = {};

        originalParams.filter[entityName][attributeName] = { [newFilterComparison]: newFilterValue };

        const newParams = stringify(originalParams, { encodeValuesOnly: true });

        goto(`${basePath}?${newParams}`, { keepFocus: true });
    };

    const handleFilterClear = () => {
        const originalParams = parse($page.url.search, { ignoreQueryPrefix: true });
        delete originalParams.filter?.[entityName]?.[attributeName];

        const newParams = stringify(originalParams, { encodeValuesOnly: true });
        goto(`${basePath}?${newParams}`, { invalidateAll: true });
    };
    //#endregion
</script>

{#if type === "text" || type === "textarea"}
    <FilterText {filterValue} {displayName} on:filter-change={handleFilterChange} on:filter-clear={handleFilterClear} />
{:else if type === "number"}
    <FilterNumber {filterValue} {displayName} on:filter-change={handleFilterChange} on:filter-clear={handleFilterClear} />
{:else if type === "checkbox"}
    <FilterCheckbox {filterValue} {displayName} on:filter-change={handleFilterChange} on:filter-clear={handleFilterClear} />
{:else if type === "select"}
    <FilterSelect {basePath} {attributeName} {displayName} {filters}></FilterSelect>
{:else if type === "select-enum"}
    <FilterEnum
        selectedValue={filterValue}
        {displayName}
        on:filter-change={handleFilterChange}
        on:filter-clear={handleFilterClear}
        {options} />
{:else if type === "date"}
    <FilterDate {filterValue} {displayName} on:filter-change={handleFilterChange} on:filter-clear={handleFilterClear} />
{:else if type === "datetime-local"}
    <FilterDatetime {filterValue} {displayName} on:filter-change={handleFilterChange} on:filter-clear={handleFilterClear} />
{:else}
    No filter
{/if}
