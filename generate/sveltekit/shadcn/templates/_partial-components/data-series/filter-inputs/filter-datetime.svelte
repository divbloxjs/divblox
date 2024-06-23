<script>
    import { Button } from "$components/shadcn/ui/button";
    import { Input } from "$components/shadcn/ui/input";
    import RotateCcw from "lucide-svelte/icons/rotate-ccw";
    import { createEventDispatcher } from "svelte";

    export let displayName;
    export let filterValue;

    const dispatch = createEventDispatcher();
</script>

<Input
    class="h-6"
    type="datetime-local"
    name={displayName}
    placeholder="Filter..."
    bind:value={filterValue}
    on:change={() => dispatch("filter-change", { filterValue, filterComparison: "eq" })} />

<Button variant="link" size="inline-icon" class="ml-2 h-4 w-4" on:click={() => dispatch("filter-clear")}>
    <RotateCcw />
</Button>
