<script>
    import { goto } from "$app/navigation";

    import { toast } from "svelte-sonner";

    import { dateProxy, superForm } from "sveltekit-superforms";
    import { zodClient } from "sveltekit-superforms/adapters";

    import { buttonVariants, Button } from "__uiComponentsPathAlias__/ui/button";

    import { __entityName__CreateSchema } from "./__entityNameKebabCase__.schema.js";

    import FormInput from "__uiComponentsPathAlias__/ui/form/_form-input.svelte";
    import FormTextarea from "__uiComponentsPathAlias__/ui/form/_form-textarea.svelte";
    import FormCheckbox from "__uiComponentsPathAlias__/ui/form/_form-checkbox.svelte";
    import FormSelect from "__uiComponentsPathAlias__/ui/form/_form-select.svelte";

    export let data;
    export let basePath = "/__entityNameKebabCase__";
    export let redirectBackPath = "/__entityNameKebabCase__";

    const form = superForm(data.form, {
        validators: zodClient(__entityName__CreateSchema),
        dataType: "json",
        onResult: async (event) => {
            if (event.result.type === "success") {
                toast.success("Created __entityName__");
                await goto(`${redirectBackPath}?event=success-create`);
            }
        }
    });

    const { form: formData, enhance, message, errors } = form;
    __proxyDefinitions__;
</script>

<form method="POST" action={`${basePath}/new?/create`} use:enhance class="w-full p-1 @container">
    <div class="columns-1 @xl:columns-2 @4xl:columns-3 @7xl:columns-4 child:break-inside-avoid-column">__formValueComponents__</div>

    {#if $message}
        <span class="text-sm font-medium italic text-destructive">{$message}</span>
    {/if}

    <div class="mt-2 flex flex-row justify-between">
        <a href={`${redirectBackPath}?event=cancel-create`} class={buttonVariants({ variant: "outline" })}>Cancel</a>
        <Button type="submit">Submit</Button>
    </div>
</form>
