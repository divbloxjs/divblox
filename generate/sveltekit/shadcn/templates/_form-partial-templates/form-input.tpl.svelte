<Form.Field {form} name="__name__">
    <Form.Control let:attrs>
        <Form.Label>__labelName__</Form.Label>
        <Input {...attrs} type="__inputType__" bind:value={$formData.__name__} />
    </Form.Control>
    <Form.FieldErrors />
</Form.Field>