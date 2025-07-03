export default function Input({ type = 'text', value, onChange, placeholder = '', ...props }) {
    return (
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '1rem',
                boxSizing: 'border-box'
            }}
            {...props}
        />
    );
}