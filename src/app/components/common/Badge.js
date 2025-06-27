export default function Badge({ children, color = '#0070f3', style = {}, ...props }) {
    return (
        <span
            style={{
                display: 'inline-block',
                background: color,
                color: '#fff',
                borderRadius: '12px',
                padding: '0.25rem 0.75rem',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                ...style
            }}
            {...props}
        >
            {children}
        </span>
    )
}