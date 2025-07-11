import React, { useState } from 'react';
import styles from './AutocompleteInput.module.scss';

const AutocompleteInput = ({ data, onSelect }) => {
    const [input, setInput] = useState('');
    const [suggestions, setSuggestions] = useState([]);

    const handleChange = (e) => {
        const value = e.target.value;
        setInput(value);

        const filtered = data
            .map((profile) => profile.ville)
            .filter(
                (ville, index, self) =>
                    ville.toLowerCase().includes(value.toLowerCase()) &&
                    self.indexOf(ville) === index
            );

        setSuggestions(filtered);
    };

    const handleSelect = (ville) => {
        setInput(ville);
        setSuggestions([]);
        onSelect(ville);
    };

    return (
        <div className={styles.autocompleteContainer}>
            <input
                type="text"
                value={input}
                onChange={handleChange}
                placeholder="Rechercher une ville ou région"
            />
            {suggestions.length > 0 && (
                <ul className={styles.suggestionsList}>
                    {suggestions.map((item, index) => (
                        <li
                            key={index}
                            className={styles.suggestionItem}
                            onClick={() => handleSelect(item)}
                        >
                            {item}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default AutocompleteInput;
