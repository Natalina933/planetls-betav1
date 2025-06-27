export default function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                background: '#fff',
                borderRadius: '8px',
                padding: '2rem',
                minWidth: '300px',
                maxWidth: '90vw',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                position: 'relative'
            }}>
                {title && <h2 style={{ marginTop: 0 }}>{title}</h2>}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'transparent',
                        border: 'none',
                        fontSize: '1.5rem',
                        cursor: 'pointer'
                    }}
                    aria-label="Fermer"
                >
                    &times;
                </button>
                <div>
                    {children}
                </div>
            </div>
        </div>
    );
}