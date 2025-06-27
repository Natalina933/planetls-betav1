import { useState } from 'react';

export default function Tooltip({ children, text, position = 'top' }) {
    const [visible, setVisible] = useState(false);

    const tooltipStyle = {
        position: 'absolute',
        zIndex: 100,
        background: '#222',
        color: '#fff',
        padding: '0.5rem 1rem',
        borderRadius: '4px',
        fontSize: '0.9rem',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        [position]: '120%',
        left: position === 'top' || position === 'bottom' ? '50%' : undefined,
        transform: position === 'top' || position === 'bottom' ? 'translateX(-50%)' : undefined,
        marginTop: position === 'top' ? '-2.5rem' : undefined,
        marginBottom: position === 'bottom' ? '-2.5rem' : undefined,
        marginLeft: position === 'left' ? '-2.5rem' : undefined,
        marginRight: position === 'right' ? '-2.5rem' : undefined,
        display: visible ? 'block' : 'none'
    };

    return (
        <span
            style={{ position: 'relative', display: 'inline-block' }}
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
        >
            {children}
            <span style={tooltipStyle}>{text}</span>
        </span>
    );
}