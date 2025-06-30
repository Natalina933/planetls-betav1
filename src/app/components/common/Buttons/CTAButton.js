import React from 'react';
import styles from './CTAButton.module.css';

const CTAButton = ({ children, onClick, className = '', type = 'button' }) => {
    return (
        <button className={`${styles.cta} ${className}`} onClick={onClick} type={type}>
            {children}
        </button>
    );
};

export default CTAButton;
