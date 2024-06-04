<script>
    import { enhance } from "$app/forms";
    import { page } from "$app/stores";

    import { Button, buttonVariants } from "__componentsPathAlias__/ui/button";
    import InputSelect from "__componentsPathAlias__/form-elements/input-select.svelte";
    import InputText from "__componentsPathAlias__/form-elements/input-text.svelte";
    import Label from "__componentsPathAlias__/form-elements/label.svelte";
    import Textarea from "__componentsPathAlias__/form-elements/textarea.svelte";

    import { __entityName__Schema } from "./__entityNameKebabCase__.schema.js";

    // __associatedEntitiesImports__;

    export let basePath = "/admin/__entityNameKebabCase__";
    export let readOnly = false;

    __relatedEntitiesOptions__;

    __formValues__;
</script>

<form method="POST" action="/__entityName__/{formValues.id}?/update" use:enhance class="max-w-sm">
    __formValueComponents__

    <div class="mt-2 flex w-full flex-row justify-between">
        <a href="/__entityName__/overview" class={buttonVariants({ variant: "outline", size: "sm" })}>Cancel</a>

        <div>
            <Button type="submit" variant="destructive" size="sm" formaction="/__entityName__/{formValues.id}?/delete">Delete</Button>
            <Button type="submit" variant="default" size="sm">Update</Button>
        </div>
    </div>
</form>

<!-- __associatedEntitiesComponents__ -->
