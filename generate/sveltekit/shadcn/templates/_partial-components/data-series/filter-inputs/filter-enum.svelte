<script>
    import * as Select from "$lib/components/shadcn/ui/select/index";
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
    <Select.Trigger>
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
