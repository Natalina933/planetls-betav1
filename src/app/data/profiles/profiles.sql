-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : mer. 30 juil. 2025 à 12:55
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
-- Structure de la table `profiles`
--

DROP TABLE IF EXISTS `profiles`;
CREATE TABLE IF NOT EXISTS `profiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `type` varchar(50) NOT NULL,
  `latitude` decimal(10,6) NOT NULL,
  `longitude` decimal(10,6) NOT NULL,
  `available` tinyint(1) DEFAULT '1',
  `photo` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_profiles_categories` (`type`)
) ENGINE=MyISAM AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `profiles`
--

INSERT INTO `profiles` (`id`, `name`, `type`, `latitude`, `longitude`, `available`, `photo`, `created_at`) VALUES
(1, 'Jean Dupont', 'concierge', 48.856600, 2.352200, 1, '/avatars/jean.png', '2025-07-28 10:49:56'),
(2, 'Marie Artisan', 'artisan', 48.860000, 2.350000, 0, '/avatars/marie.png', '2025-07-28 10:49:56'),
(3, 'Paul Proprio', 'proprietaire', 48.855000, 2.340000, 1, '/avatars/marc.png', '2025-07-28 10:49:56'),
(4, 'Alice Concierge', 'concierge', 48.854200, 2.341100, 1, '\\default-profileF.png', '2025-07-28 10:49:56'),
(5, 'Léo Proprio', 'proprietaire', 48.858100, 2.349900, 1, '/avatars/leo.png', '2025-07-28 10:49:56'),
(6, 'Julie Artisan', 'artisan', 48.859000, 2.350100, 1, '/avatars/julie.png', '2025-07-28 10:49:56'),
(7, 'Victor Concierge', 'concierge', 48.857100, 2.348200, 1, '/avatars/victor.png', '2025-07-28 10:49:56'),
(8, 'Emma Proprio', 'proprietaire', 48.851000, 2.339000, 1, '/avatars/emma.png', '2025-07-28 10:49:56'),
(9, 'David Artisan', 'artisan', 48.853500, 2.345000, 1, '\\default-profileM.png', '2025-07-28 10:49:56'),
(10, 'Sophie Concierge', 'concierge', 48.852500, 2.347000, 1, '/avatars/sophie.png', '2025-07-28 10:49:56'),
(11, 'Martin Proprio', 'proprietaire', 48.850100, 2.342100, 1, '', '2025-07-28 10:49:56');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
