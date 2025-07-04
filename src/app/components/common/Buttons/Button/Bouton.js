import styles from './Bouton.module.scss';

export default function Bouton({ children, onClick, className = '', ...props }) {
    return (
        <button
            onClick={onClick}
            className={`${styles.bouton} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
