<script>
    import { enhance } from "$app/forms";
    import { page } from "$app/stores";

    import { Button, buttonVariants } from "__componentsPathAlias__/ui/button";
    import * as Form from "__componentsPathAlias__/ui/form";
    import { Input } from "__componentsPathAlias__/ui/input";
    import { Textarea } from "__componentsPathAlias__/ui/textarea";

    import { __entityName__Schema } from "./__entityNameKebabCase__.schema.js";

    // __associatedEntitiesImports__;

    export let basePath = "/admin/__entityNameKebabCase__";
    export let readOnly = false;

    __relatedEntitiesOptions__;

    __formValues__;
</script>

<form method="POST" action="/__entityNameKebabCase__/{formValues.id}?/update" use:enhance class="max-w-sm">
    __formValueComponents__

    <div class="mt-2 flex w-full flex-row justify-between">
        <a href="/__entityNameKebabCase__/overview" class={buttonVariants({ variant: "outline", size: "sm" })}>Cancel</a>

        <div>
            <Button type="submit" variant="destructive" size="sm" formaction="/__entityNameKebabCase__/{formValues.id}?/delete">Delete</Button>
            <Button type="submit" variant="default" size="sm">Update</Button>
        </div>
    </div>
</form>

<!-- __associatedEntitiesComponents__ -->
