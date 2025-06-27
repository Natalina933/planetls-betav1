export default function Select({ value, onChange, options = [], placeholder = '', ...props }) {
    return (
        <select
            value={value}
            onChange={onChange}
            style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '1rem',
                boxSizing: 'border-box'
            }}
            {...props}
        >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((option) =>
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            )}
        </select>
    );
}