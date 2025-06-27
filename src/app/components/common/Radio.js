export default function Radio({ name, value, checked, onChange, label, ...props }) {
    return (
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginRight: '1rem' }}>
            <input
                type="radio"
                name={name}
                value={value}
                checked={checked}
                onChange={onChange}
                style={{ marginRight: '0.5rem' }}
                {...props}
            />
            {label}
        </label>
    );
}