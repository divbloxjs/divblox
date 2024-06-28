<script>
    import { enhance } from "$app/forms";
    import { goto } from "$app/navigation";

    import { superForm } from "sveltekit-superforms";
    import { zodClient } from "sveltekit-superforms/adapters";
    import { toast } from "svelte-sonner";
    import { Button, buttonVariants } from "__uiComponentsPathAlias__/ui/button";

    import { __entityName__UpdateSchema } from "./__entityNameKebabCase__.schema.js";

    import FormSelect from "__uiComponentsPathAlias__/ui/form/_form-select.svelte";
    import FormInput from "__uiComponentsPathAlias__/ui/form/_form-input.svelte";
    import FormTextarea from "__uiComponentsPathAlias__/ui/form/_form-textarea.svelte";
    import FormCheckbox from "__uiComponentsPathAlias__/ui/form/_form-checkbox.svelte";

    import AlertDialog from "__uiComponentsPathAlias__/ui/alert-dialog/_alert-dialog.svelte";

    export let data;
    export let basePath = "/__entityNameKebabCase__";
    export let redirectBackPath = "/__entityNameKebabCase__";

    let deleteAlertOpen = false;
    let deleteFormEl;

    const form = superForm(data.form, {
        validators: zodClient(__entityName__UpdateSchema),
        dataType: "json",
        onResult: async (event) => {
            if (event.result.type === "success") {
                toast.success("Updated __entityName__");
                await goto(`${redirectBackPath}?event=success-update`);
            }
        }
    });

    const { form: formData, enhance: formEnhance, message, errors, submitting } = form;
</script>

<form method="POST" action={`${basePath}/${$formData.id}?/update`} use:formEnhance class="w-full p-1 @container">
    <div class="columns-1 @xl:columns-2 @4xl:columns-3 @7xl:columns-4 child:break-inside-avoid-column">
    <FormInput {form} name="id" label="id" type="hidden" bind:value={$formData.id} />

__formValueComponents__
    </div>

    {#if $message}
        <div class="text-destructive">{$message}</div>
    {/if}

    <div class="mt-2 flex w-full flex-row justify-between">
        <a href={`${redirectBackPath}?event=cancel-update`} class={buttonVariants({ variant: "outline", size: "sm" })}>Cancel</a>

        <div class="flex gap-2">
            <form
                method="POST"
                action={`${basePath}/${$formData.id}?/delete`}
                bind:this={deleteFormEl}
                use:enhance={() => {
                    return async ({ result, update }) => {
                        if (result.type !== "success") {
                            toast.error("Could not delete __entityName__");
                            return;
                        }

                        await goto(`${redirectBackPath}?event=success-delete`);
                    };
                }}>
                <Button variant="destructive" size="sm" on:click={() => (deleteAlertOpen = !deleteAlertOpen)}>Delete</Button>

                <AlertDialog
                    bind:open={deleteAlertOpen}
                    formToSubmit={deleteFormEl}
                    title="Are you sure?"
                    description="This will permanently delete this entry." />
            </form>

            <Button type="submit" variant="default" size="sm" disabled={$submitting} loading={$submitting}>Update</Button>
        </div>
    </div>
</form>
