-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : mer. 30 juil. 2025 à 17:41
-- Version du serveur : 8.3.0
-- Version de PHP : 8.3.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `datas-planetls`
--

-- --------------------------------------------------------

--
-- Structure de la table `categories`
--

DROP TABLE IF EXISTS `categories`;
CREATE TABLE IF NOT EXISTS `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `key` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `group_key` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `categories`
--

INSERT INTO `categories` (`id`, `key`, `label`, `icon`, `image`, `description`, `group_key`) VALUES
(1, 'proprietaire', 'Propriétaires', 'FaHome', '/images/carousel/proprio.jpeg', 'Propriétaires locaux, engagés et à l’écoute', 'proprietaire'),
(2, 'concierge', 'Conciergerie', 'FaBell', '/images/carousel/concierges.jpg', 'Concierges de quartier, service sur-mesure', 'concierge'),
(3, 'artisan', 'Artisan', 'FaTools', '/images/carousel/artisans.jpg', 'Artisans passionnés, savoir-faire local', 'artisans'),
(4, 'commercant', 'Commerçant', 'FaStore', '/images/carousel/commercant.jpeg', 'Commerçants de proximité, produits uniques', 'artisans'),
(5, 'photographe', 'Photographe', 'FaCamera', '/images/carousel/photographe.jpg', 'Photographes inspirés, regards neufs', 'artisans'),
(6, 'jardinier', 'Jardinier', 'FaLeaf', '/images/carousel/jardinier.jpg', 'Jardiniers urbains, espaces vivants', 'artisans'),
(7, 'reseaux', 'Réseaux sociaux', 'FaShareAlt', '/images/carousel/reseaux.jpeg', 'Experts réseaux sociaux, visibilité locale', 'artisans'),
(8, 'decoration', 'Décoration', 'FaPaintBrush', NULL, 'Décorateurs créatifs, ambiances personnalisées', 'artisans'),
(9, 'electricien', 'Électricien', 'FaBolt', NULL, 'Électriciens de proximité, interventions rapides', 'artisans'),
(10, 'plombier', 'Plombier', 'FaWrench', NULL, 'Plombiers qualifiés, services urgents et sur-mesure', 'artisans'),
(11, 'pisciniste', 'Pisciniste', 'FaSwimmingPool', NULL, 'Piscinistes experts, détente à domicile', 'artisans'),
(12, 'menuisier', 'Menuisier', 'FaHammer', NULL, 'Experts du bois, tradition et sur-mesure', 'artisans'),
(13, 'reparateur', 'Réparateur', 'FaScrewdriver', NULL, 'Petits travaux et réparations rapides', 'artisans'),
(14, 'blanchisseur', 'Blanchisseur', 'FaSoap', NULL, 'Entretien textile et pressing local', 'artisans'),
(15, 'maintenance', 'Maintenance', 'FaToolbox', NULL, 'Services techniques réguliers', 'artisans'),
(16, 'installateur', 'Installateur', 'FaPlug', NULL, 'Montage d’équipements et installations domestiques', 'artisans'),
(17, 'conciergerie_pro', 'Conciergerie Pro', 'FaUserTie', NULL, 'Experts en gestion haut de gamme et accueil sur-mesure', 'concierge');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
