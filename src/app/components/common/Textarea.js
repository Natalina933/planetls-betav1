export default function Textarea({ value, onChange, placeholder = '', rows = 4, ...props }) {
    return (
        <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '1rem',
                resize: 'vertical',
                boxSizing: 'border-box'
            }}
            {...props}
        />
    );
}