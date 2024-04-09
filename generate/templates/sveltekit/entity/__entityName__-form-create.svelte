<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import InputSelect from "../form-elements/input-select.svelte"
	import InputText from "../form-elements/input-text.svelte"
	import Textarea from "../form-elements/textarea.svelte"

__relatedEntitiesOptions__;

__formValues__;

</script>

<a href="/__entityName__/overview">back</a>
<form method="POST" action="/__entityName__/new?/create" use:enhance>
__formValueComponents__
	<button>Create</button>
</form>
