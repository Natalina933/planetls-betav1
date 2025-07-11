DROP TABLE IF EXISTS profile_services;
DROP TABLE IF EXISTS profiles;

CREATE TABLE profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    latitude DECIMAL(10,6) NOT NULL,
    longitude DECIMAL(10,6) NOT NULL,
    available BOOLEAN DEFAULT TRUE,
    photo VARCHAR(255),
    CONSTRAINT fk_profiles_categories FOREIGN KEY (type) REFERENCES categories(`key`) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE profile_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    profile_id INT NOT NULL,
    service VARCHAR(100) NOT NULL,
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

INSERT INTO profiles (name, type, latitude, longitude, available, photo) VALUES
('Jean Dupont', 'concierge', 48.8566, 2.3522, TRUE, '/avatars/jean.png'),
('Marie Artisan', 'artisan', 48.8600, 2.3500, FALSE, '/avatars/marie.png'),
('Paul Proprio', 'proprietaire', 48.8550, 2.3400, TRUE, '/avatars/marc.png');

INSERT INTO profile_services (profile_id, service) VALUES
(1, 'Gestion'),
(1, 'Nettoyage'),
(2, 'Plomberie'),
(2, 'Électricité');
