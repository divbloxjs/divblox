<script>
	export let value;
	export let attributeName;
	export let labelValue;
</script>

<label for={attributeName}>
	{labelValue}
	<input bind:value name={attributeName} type="text" {...$$restProps} />
</label>
