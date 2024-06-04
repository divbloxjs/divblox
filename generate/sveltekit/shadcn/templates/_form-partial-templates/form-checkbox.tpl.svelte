<Form.Field {form} name="__name__">
    <Form.Control let:attrs>
        <Form.Label>__labelName__</Form.Label>
        <Checkbox {...attrs} bind:checked={$formData.__name__} />
    </Form.Control>
    <Form.FieldErrors />
</Form.Field>