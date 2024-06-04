<script>
	export let value;
	export let attributeName;
	export let labelValue;
	export let options = [];
	export let optionValue = 'id';
	export let optionDisplayName = 'id';
</script>

<label for={attributeName}>
	{labelValue}
	<select name={attributeName} bind:value {...$$restProps}>
		{#each options as option}
			<option value={option[optionValue]} selected={optionValue === value}>
				{option[optionDisplayName]}
			</option>
		{/each}
	</select>
</label>
