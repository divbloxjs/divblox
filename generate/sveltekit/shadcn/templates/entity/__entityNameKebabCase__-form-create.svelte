<script>
    import { goto } from "$app/navigation";

    import { toast } from "svelte-sonner";

    import { superForm } from "sveltekit-superforms";
    import { zodClient } from "sveltekit-superforms/adapters";

    import { buttonVariants, Button } from "__uiComponentsPathAlias__/ui/button";

    import { __entityName__CreateSchema } from "./__entityNameKebabCase__.schema.js";

    import FormInput from "__uiComponentsPathAlias__/ui/form/_form-input.svelte";
    import FormTextarea from "__uiComponentsPathAlias__/ui/form/_form-textarea.svelte";
    import FormCheckbox from "__uiComponentsPathAlias__/ui/form/_form-checkbox.svelte";
    import FormSelect from "__uiComponentsPathAlias__/ui/form/_form-select.svelte";

    export let data;
    export let basePath = "/__entityNameKebabCase__";

    const form = superForm(data.form, {
        validators: zodClient(__entityName__CreateSchema),
        onResult: async (event) => {
            if (event.result.type === "success") {
                toast.success("Created __entityName__");
                await goto(`${basePath}/overview`);
            }
        }
    });

    const { form: formData, enhance, message, errors } = form;
</script>

<form method="POST" action={`${basePath}/new?/create`} use:enhance class="@container w-full p-1">
    <div class="@7xl:columns-4 @4xl:columns-3 @xl:columns-2 child:break-inside-avoid-column columns-1">
__formValueComponents__
    </div>

    {#if $message}
        <span class="text-sm font-medium italic text-destructive">{$message}</span>
    {/if}

    <div class="mt-2 flex flex-row justify-between">
        <a href={`${basePath}/overview`} class={buttonVariants({ variant: "outline" })}>Cancel</a>
        <Button type="submit">Submit</Button>
    </div>
</form>
