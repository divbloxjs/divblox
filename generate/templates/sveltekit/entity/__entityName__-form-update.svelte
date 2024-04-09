<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import InputSelect from "__componentsPathAlias__/form-elements/input-select.svelte"
	import InputText from "__componentsPathAlias__/form-elements/input-text.svelte"
	import Textarea from "__componentsPathAlias__/form-elements/textarea.svelte"

// __associatedEntitiesImports__;

	export let readOnly = false;

__relatedEntitiesOptions__;

__formValues__;

</script>

<a href="/__entityName__/overview">back</a>
<form method="POST" action="/__entityName__/{formValues.id}?/update" use:enhance>
__formValueComponents__
	<button>Update</button>
	<button formaction="/__entityName__/{formValues.id}?/delete">Delete</button>
</form>

<!-- __associatedEntitiesComponents__ -->
