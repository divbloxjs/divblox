<script>
    import { superForm } from "sveltekit-superforms";
    import { zodClient } from "sveltekit-superforms/adapters";

    import { buttonVariants } from "__componentsPathAlias__/ui/button";
    import * as Form from "__componentsPathAlias__/ui/form";
    import { Input } from "__componentsPathAlias__/ui/input";

    import { userAccountSchema } from "./user-account.schema";

    export let data;
    export let basePath = "/admin/user-account";

    const form = superForm(data.form, {
        validators: zodClient(userAccountSchema)
    });

    const { form: formData, enhance, message, errors } = form;
</script>

<form method="POST" action={`${basePath}/new?/create`} use:enhance class="flex max-w-lg flex-grow flex-col">
    <Form.Field {form} name="firstName">
        <Form.Control let:attrs>
            <Form.Label>First Name</Form.Label>
            <Form.FieldErrors />

            <Input {...attrs} bind:value={$formData.firstName} />
        </Form.Control>
    </Form.Field>
    <Form.Field {form} name="lastName">
        <Form.Control let:attrs>
            <Form.Label>Last Name</Form.Label>
            <Input {...attrs} bind:value={$formData.lastName} />
        </Form.Control>
        <Form.FieldErrors />
    </Form.Field>
    <Form.Field {form} name="emailAddress">
        <Form.Control let:attrs>
            <Form.Label>Email Address</Form.Label>
            <Input {...attrs} bind:value={$formData.emailAddress} />
        </Form.Control>
        <Form.FieldErrors />
    </Form.Field>
    <Form.Field {form} name="password">
        <Form.Control let:attrs>
            <Form.Label>Password</Form.Label>
            <Input {...attrs} type="password" bind:value={$formData.password} />
        </Form.Control>
        <Form.FieldErrors />
    </Form.Field>
    <Form.Field {form} name="confirmPassword">
        <Form.Control let:attrs>
            <Form.Label>Confirm Password</Form.Label>
            <Input {...attrs} type="password" bind:value={$formData.confirmPassword} />
        </Form.Control>
        <Form.FieldErrors />
    </Form.Field>

    {#if $message}
        <span class="text-sm font-medium italic text-destructive">{$message}</span>
    {/if}

    <div class="mt-2 flex flex-row justify-between">
        <a href={`${basePath}/overview`} class={buttonVariants({ variant: "outline" })}>Cancel</a>
        <Form.Button>Submit</Form.Button>
    </div>
</form>

