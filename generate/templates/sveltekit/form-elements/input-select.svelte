<script>
	export let value;
	export let attributeName;
	export let labelValue;
	export let options;
</script>

<label for={attributeName}>
	{labelValue}
	<select name={attributeName} bind:value {...$$restProps}>
		{#each options as { optionValue, displayValue }}
			<option value={optionValue} selected={optionValue === selectedValue}>{displayValue}</option>
		{/each}
	</select>
</label>
