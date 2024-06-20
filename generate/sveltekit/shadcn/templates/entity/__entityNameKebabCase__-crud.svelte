<script>
	import DataList__entityNamePascalCase__ from '__dataModelComponentsPathAlias__/__entityNameKebabCase__/__entityNameKebabCase__-data-list.svelte';
	import DataTable__entityNamePascalCase__ from '__dataModelComponentsPathAlias__/__entityNameKebabCase__/__entityNameKebabCase__-data-table.svelte';

	export let basePath = "/__entityNameKebabCase__";
	export let data;
</script>

<div class="flex w-full @container">
    <div class="hidden w-full @lg:block">
        <DataTable__entityNamePascalCase__ {data} {basePath} allowDelete={true} allowEdit={true} />
    </div>

    <div class="w-full @lg:hidden">
        <DataList__entityNamePascalCase__ {data} {basePath} />
    </div>
</div>
