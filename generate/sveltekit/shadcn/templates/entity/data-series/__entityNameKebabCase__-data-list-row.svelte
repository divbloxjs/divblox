<script>
    import { goto } from "$app/navigation";
    import { createEventDispatcher } from "svelte";

    export let __entityName__Data;
    export let basePath = "/__entityNameKebabCase__";
    export let redirectBackPath = "";

    // Set to true if you want to handle the row click event manually in parent component
    export let disableDefaultRowClickAction = false;

    const dispatch = createEventDispatcher();

    const searchParams = new URLSearchParams();
    if (redirectBackPath) searchParams.set("redirectBackPath", redirectBackPath);
</script>

<button
    class="w-full bg-card px-2 py-4 text-left"
    on:click={() => {
        dispatch("row-clicked", { rowData: __entityName__Data });

        if (!disableDefaultRowClickAction) {
            goto(`${basePath}/${__entityName__Data.id}?${searchParams.toString()}`);
        }
    }}>
    __entityRowHtml__
</button>

<!-- Interrogate relationships in the __entityName__Data object -->

