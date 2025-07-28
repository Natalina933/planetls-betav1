DROP TABLE IF EXISTS profile_services;
DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS categories;

-- Catégories de profils (clé primaire 'key')
CREATE TABLE categories (
    `key` VARCHAR(50) PRIMARY KEY,
    label VARCHAR(100)
);

INSERT INTO categories (`key`, label) VALUES
('proprietaire', 'Propriétaire'),
('concierge', 'Conciergerie'),
('artisan', 'Artisan');

-- Profils
CREATE TABLE profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    latitude DECIMAL(10,6) NOT NULL,
    longitude DECIMAL(10,6) NOT NULL,
    available BOOLEAN DEFAULT TRUE,
    photo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_profiles_categories FOREIGN KEY (type)
        REFERENCES categories(`key`) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Services proposés par chaque profil
CREATE TABLE profile_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    profile_id INT NOT NULL,
    service VARCHAR(100) NOT NULL,
     CONSTRAINT uq_profile_service UNIQUE (profile_id, service),
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Profils simulés (minimum 11 pour activer la bulle "Tous")
INSERT INTO profiles (name, type, latitude, longitude, available, photo) VALUES
('Jean Dupont', 'concierge', 48.8566, 2.3522, TRUE, '/avatars/jean.png'),
('Marie Artisan', 'artisan', 48.8600, 2.3500, FALSE, '/avatars/marie.png'),
('Paul Proprio', 'proprietaire', 48.8550, 2.3400, TRUE, '/avatars/marc.png'),
('Alice Concierge', 'concierge', 48.8542, 2.3411, TRUE, '/avatars/alice.png'),
('Léo Proprio', 'proprietaire', 48.8581, 2.3499, TRUE, '/avatars/leo.png'),
('Julie Artisan', 'artisan', 48.8590, 2.3501, TRUE, '/avatars/julie.png'),
('Victor Concierge', 'concierge', 48.8571, 2.3482, TRUE, '/avatars/victor.png'),
('Emma Proprio', 'proprietaire', 48.8510, 2.3390, TRUE, '/avatars/emma.png'),
('David Artisan', 'artisan', 48.8535, 2.3450, TRUE, '/avatars/david.png'),
('Sophie Concierge', 'concierge', 48.8525, 2.3470, TRUE, '/avatars/sophie.png'),
('Martin Proprio', 'proprietaire', 48.8501, 2.3421, TRUE, '/avatars/martin.png');

-- Services associés
INSERT INTO profile_services (profile_id, service) VALUES
(1, 'Gestion des clés'),
(1, 'Nettoyage'),
(1, 'Plomberie'),
(2, 'Électricité'),
(2, 'Peinture'),
(3, 'Jardinage'),
(3, 'Réparation'),
(4, 'Installation'),
(4, 'check-in'),
(4, 'check-out'),
(5, 'Assistance technique'),
(5, 'Réparation de meubles'),
(5, 'Nettoyage de fin de séjour'),
(5, 'Maintenance'),
(5, 'Loueur de biens'),
(6, 'Plomberie'),
(6, 'Électricité'),
(6, 'Peinture'),
(6, 'Décoration'),
(6, 'Menuiserie'),
(7, 'Gestion des réservations'),
(7, 'Assistance technique'),
(7, 'Nettoyage'),
(7, 'Assistance voyageurs'),
(7, 'Jardinage'),
(7, 'Blanchisserie'),
(8, 'Réparation de meubles'),
(8, 'Installation de cuisine'),
(8, 'Décoration intérieure'),
(8, 'Blanchisserie'),
(8, 'Réparation'),
(8, 'Remise des clés'),
(9, 'Gestion des clés'),
(9, 'Nettoyage de fin de séjour'),
(9, 'Assistance technique'),
(9, 'Remise des clés'),
(9, 'Installation'),
(9, 'Décoration'),
(10, 'Plomberie'),
(10, 'Électricité'),
(10, 'Peinture'),
(10, 'Menuiserie'),
(10, 'Maintenance'),
(10, 'Assistance voyageurs');

