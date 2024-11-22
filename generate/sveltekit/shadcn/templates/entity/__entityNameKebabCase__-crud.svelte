<script>
    import DataList__entityNamePascalCase__ from "__dataModelComponentsPathAlias__/__entityNameKebabCase__/__entityNameKebabCase__-data-list.svelte";
    import DataTable__entityNamePascalCase__ from "__dataModelComponentsPathAlias__/__entityNameKebabCase__/__entityNameKebabCase__-data-table.svelte";

    export let basePath = "/__entityNameKebabCase__";
    export let data;
</script>

<div class="flex h-full w-full p-2 @container">
    <div class="hidden w-full @lg:block">
        <DataTable__entityNamePascalCase__ {data} {basePath} allowDelete={true} allowEdit={true} />
    </div>

    <div class="h-full max-h-full w-full @lg:hidden">
        <DataList__entityNamePascalCase__ getEntityArrayPath={basePath} entityInstancePath={basePath} redirectBackPath={basePath} />
    </div>
</div>
