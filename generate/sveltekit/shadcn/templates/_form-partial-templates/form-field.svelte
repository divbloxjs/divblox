<Form.Field {form} name="[name]">
    <Form.Control let:attrs>
        <Form.Label>[label]</Form.Label>
        <Input {...attrs} bind:value={$formData.[name]} />
    </Form.Control>
    <Form.FieldErrors />
</Form.Field>