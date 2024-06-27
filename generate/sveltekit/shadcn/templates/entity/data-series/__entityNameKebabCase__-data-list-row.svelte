<script>
    import { goto } from "$app/navigation";

    export let __entityName__Data;
    export let basePath = "/__entityNameKebabCase__";
    export let redirectBackPath = "";

    const searchParams = new URLSearchParams();
    if (redirectBackPath) searchParams.set("redirectBackPath", redirectBackPath);
</script>

<button
    class="w-full bg-card px-2 py-4 text-left"
    on:click={() => {
        goto(`${basePath}/${__entityName__Data.id}?${searchParams.toString()}`);
    }}>
    __entityRowHtml__
</button>

<!-- Interrogate relationships in the __entityName__Data object -->

