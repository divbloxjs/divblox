<script>
    import { goto } from "$app/navigation";

    export let userSessionData;
    export let basePath = "/user-session";
</script>

<button
    class="w-full bg-card px-2 py-4"
    on:click={() => {
        goto(`${basePath}/${userSessionData.id}`);
    }}>
    __entityRowHtml__
</button>

<!-- Interrogate relationships in the userSessionData object -->

