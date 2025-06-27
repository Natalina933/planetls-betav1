export default function Loader({ size = 48, color = '#222' }) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80px'
        }}>
            <span style={{
                display: 'inline-block',
                width: size,
                height: size,
                border: `4px solid ${color}`,
                borderTop: `4px solid transparent`,
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }} />
            <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg);}
          100% { transform: rotate(360deg);}
        }
      `}</style>
        </div>
    );
}