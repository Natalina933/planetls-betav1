export default function Checkbox({ checked, onChange, label, ...props }) {
    return (
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginRight: '1rem' }}>
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                style={{ marginRight: '0.5rem' }}
                {...props}
            />
            {label}
        </label>
    );
}