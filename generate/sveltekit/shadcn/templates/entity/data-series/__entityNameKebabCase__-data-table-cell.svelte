<script>
    import Checkbox from "$components/shadcn/ui/checkbox/checkbox.svelte";
    import { format } from "date-fns";
    import { Check, X } from "lucide-svelte";

    export let value;
    export let type;
</script>

<td class="min-w-48 max-w-56 truncate border-r">
    {#if value === null || value === undefined}
        N/A
    {:else if type === "date" && value instanceof Date}
        {format(value, "yyyy-MM-dd")}
    {:else if type === "checkbox"}
        {#if value}
            <Check class="text-success" />
        {:else}
            <X class="text-destructive" />
        {/if}
    {:else}
        {@html value}
    {/if}
</td>
