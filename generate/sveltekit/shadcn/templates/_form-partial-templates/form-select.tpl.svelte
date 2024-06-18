<FormSelect
    {form}
    name="__nameIdSqlCase__"
    label="__labelName__"
    bind:selectedValue={$formData.__nameIdSqlCase__}
    options={data?.__name__Options?.map((option) => {
        return {
            label: option.id,
            value: option.id
        };
})} />