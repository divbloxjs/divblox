<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import InputSelect from "__uiComponentsPathAlias__/form-elements/input-select.svelte"
	import InputText from "__uiComponentsPathAlias__/form-elements/input-text.svelte"
	import Textarea from "__uiComponentsPathAlias__/form-elements/textarea.svelte"

__relatedEntitiesOptions__;

__formValues__;

</script>

<a href="/__entityNameKebabCase__/overview">back</a>
<form method="POST" action="/__entityNameKebabCase__/new?/create" use:enhance>
__formValueComponents__
	<button>Create</button>
</form>
