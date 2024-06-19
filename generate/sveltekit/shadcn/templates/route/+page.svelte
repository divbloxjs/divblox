<script>
    import CrudUserSession from "$lib/components/data-model/__entityNameKebabCase__/__entityNameKebabCase__-crud.svelte";

    export let data;
</script>

<CrudUserSession {data} basePath="/__entityNameKebabCase__" />
