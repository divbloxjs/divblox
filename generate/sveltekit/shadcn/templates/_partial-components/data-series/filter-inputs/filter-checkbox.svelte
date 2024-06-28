<script>
    import { Button } from "$components/shadcn/ui/button";
    import Checkbox from "$components/shadcn/ui/checkbox/checkbox.svelte";
    import { Input } from "$components/shadcn/ui/input";
    import Label from "$components/shadcn/ui/label/label.svelte";
    import RotateCcw from "lucide-svelte/icons/rotate-ccw";
    import { createEventDispatcher } from "svelte";

    export let displayName;
    export let filterValue;

    const dispatch = createEventDispatcher();

    const handleFilterChange = () => {
        dispatch("filter-change", { filterValue, filterComparison: "eq" });
    };

    const handleFilterClear = () => {
        filterValue = "";
        dispatch("filter-clear");
    };
</script>

No filter

<!-- TODO Finalise how the checkbox filter looks -->
<!-- <Label>{displayName}</Label>
<Checkbox name={displayName} placeholder="Filter..." bind:checked={filterValue} on:change={handleFilterChange} />

<Button variant="link" size="inline-icon" class="ml-2 h-4 w-4" on:click={handleFilterClear}>
    <RotateCcw />
</Button> -->
