export default function Card({ children, style = {}, ...props }) {
    return (
        <div
            style={{
                background: '#fff',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                padding: '1.5rem',
                margin: '1rem 0',
                ...style
            }}
            {...props}
        >
            {children}
        </div>
    );
}