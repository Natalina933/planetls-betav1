export default function Bouton({ children, onClick, style = {}, ...props }) {
    return (
        <button
            onClick={onClick}
            style={{
                background: '#0070f3',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'background 0.2s',
                ...style
            }}
            {...props}
        >
            {children}
        </button>
    );
}