<script>
    import Button from "$components/shadcn/ui/button/button.svelte";
    import * as Select from "$lib/components/shadcn/ui/select/index";
    import { RotateCcw } from "lucide-svelte";
    import { createEventDispatcher } from "svelte";

    export let placeholder = "-Please Select-";
    export let name;
    export let label = name;

    export let options = [];
    export let selectedValue = "";

    const dispatch = createEventDispatcher();

    let selected;

    $: selectedValue, (selected = options.find(({ value, label }) => value === selectedValue) ?? { label: "-Please Select-", value: "" });
</script>

<Select.Root
    {selected}
    onSelectedChange={(v) => {
        v && (selectedValue = v.value);
        dispatch("filter-change", { filterValue: selectedValue, filterComparison: "eq" });
    }}>
    <Select.Input {name} />
    <Select.Trigger class="h-6">
        <Select.Value {placeholder} />
    </Select.Trigger>
    <Select.Content>
        {#if options.length === 0}
            <Select.Item disabled value="" label="No options" />
        {/if}

        {#each options as option}
            <Select.Item value={option.value} label={option.label} />
        {/each}
    </Select.Content>
</Select.Root>

<Button variant="link" size="inline-icon" class="ml-2 h-4 w-4" on:click={() => dispatch("filter-clear")}>
    <RotateCcw />
</Button>
