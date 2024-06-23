<script>
    import { goto } from "$app/navigation";

    export let __entityName__Data;
    export let basePath = "/__entityNameKebabCase__";
</script>

<button
    class="w-full bg-card px-2 py-4 text-left"
    on:click={() => {
        goto(`${basePath}/${__entityName__Data.id}`);
    }}>
    __entityRowHtml__
</button>

<!-- Interrogate relationships in the __entityName__Data object -->

