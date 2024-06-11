<FormSelect
    {form}
    name="__name__Id"
    label="__labelName__"
    bind:selectedValue={$formData.__name__Id}
    options={data?.__name__Options?.map((option) => {
        return {
            label: option.id,
            value: option.id
        };
})} />