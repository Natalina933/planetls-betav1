import { FaFacebook, FaInstagram, FaLinkedin } from "react-icons/fa";
import styles from "./SocialMediaBar.module.scss";
export function SocialMediaBar() {
    return (
        <div className={styles.socialBar}>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
                <FaFacebook size={24} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                <FaInstagram size={24} />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                <FaLinkedin size={24} />
            </a>
        </div>
    );
}
