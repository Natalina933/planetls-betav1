-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : mer. 30 juil. 2025 à 17:16
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
-- Structure de la table `profile_services`
--

DROP TABLE IF EXISTS `profile_services`;
CREATE TABLE IF NOT EXISTS `profile_services` (
  `id` int NOT NULL AUTO_INCREMENT,
  `profile_id` int NOT NULL,
  `service` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_profile_service` (`profile_id`,`service`)
) ENGINE=MyISAM AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `profile_services`
--

INSERT INTO `profile_services` (`id`, `profile_id`, `service`) VALUES
(1, 1, 'Gestion des clés'),
(2, 1, 'Nettoyage'),
(3, 1, 'Plomberie'),
(4, 2, 'Électricité'),
(5, 2, 'Peinture'),
(6, 3, 'Jardinage'),
(7, 3, 'Réparation'),
(8, 4, 'Installation'),
(9, 4, 'check-in'),
(10, 4, 'check-out'),
(11, 5, 'Assistance technique'),
(12, 5, 'Réparation de meubles'),
(13, 5, 'Nettoyage de fin de séjour'),
(14, 5, 'Maintenance'),
(15, 5, 'Loueur de biens'),
(16, 6, 'Plomberie'),
(17, 6, 'Électricité'),
(18, 6, 'Peinture'),
(19, 6, 'Décoration'),
(20, 6, 'Menuiserie'),
(21, 7, 'Gestion des réservations'),
(22, 7, 'Assistance technique'),
(23, 7, 'Nettoyage'),
(24, 7, 'Assistance voyageurs'),
(25, 7, 'Jardinage'),
(26, 7, 'Blanchisserie'),
(27, 8, 'Réparation de meubles'),
(28, 8, 'Installation de cuisine'),
(29, 8, 'Décoration intérieure'),
(30, 8, 'Blanchisserie'),
(31, 8, 'Réparation'),
(32, 8, 'Remise des clés'),
(33, 9, 'Gestion des clés'),
(34, 9, 'Nettoyage de fin de séjour'),
(35, 9, 'Assistance technique'),
(36, 9, 'Remise des clés'),
(37, 9, 'Installation'),
(38, 9, 'Décoration'),
(39, 10, 'Plomberie'),
(40, 10, 'Électricité'),
(41, 10, 'Peinture'),
(42, 10, 'Menuiserie'),
(43, 10, 'Maintenance'),
(44, 10, 'Assistance voyageurs');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
