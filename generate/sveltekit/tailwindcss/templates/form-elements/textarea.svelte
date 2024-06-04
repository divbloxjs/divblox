<script>
	export let attributeName;
	export let labelValue;
	export let value;
</script>

<label for={attributeName}>
	{labelValue}
	<textarea name={attributeName} {...$$restProps}>{value}</textarea>
</label>
