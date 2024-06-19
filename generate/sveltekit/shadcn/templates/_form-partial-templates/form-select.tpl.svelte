<FormSelect
    {form}
    name="__nameSqlCase__"
    label="__labelName__"
    bind:selectedValue={$formData.__nameSqlCase__}
    options={data?.__name__Options?.map((option) => {
        return {
            label: option.id,
            value: option.id
        };
})} />