
DROP TABLE IF EXISTS categories;
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    `key` VARCHAR(50) NOT NULL UNIQUE,
    label VARCHAR(100) NOT NULL,
    icon VARCHAR(100) NOT NULL,
    image VARCHAR(255),
    description TEXT
);

INSERT INTO categories (`key`, label, icon, image, description) VALUES
('proprietaire', 'Propriétaires', 'FaHome', '/images/carousel/proprio.jpeg', 'Propriétaires locaux, engagés et à l’écoute'),
('concierge', 'Conciergerie', 'FaBell', '/images/carousel/concierges.jpg', 'Concierges de quartier, service sur-mesure'),
('artisan', 'Artisans', 'FaTools', '/images/carousel/artisans.jpg', 'Artisans passionnés, savoir-faire local'); 
CREATE TABLE IF NOT EXISTS category_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    profile_id INT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);
