CREATE TABLE IF NOT EXISTS `users` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `full_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(100) NOT NULL,
  `phone_number` VARCHAR(20) NOT NULL,
  `address` VARCHAR(255) NOT NULL,
  `role` ENUM('user', 'admin') DEFAULT 'user',
  `is_verified` BOOLEAN DEFAULT FALSE,
  `verification_token` VARCHAR(100),
  `reset_password_token` VARCHAR(100),
  `reset_password_expires` DATETIME,
  `last_login` DATETIME,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `description` VARCHAR(255),
  `icon` VARCHAR(50),
  `priority` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `found_items` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `firestore_id` VARCHAR(100),
  `item_name` VARCHAR(100) NOT NULL,
  `category_id` INT NOT NULL,
  `description` VARCHAR(255),
  `location` VARCHAR(100) NOT NULL,
  `found_date` DATE NOT NULL,
  `image_url` VARCHAR(255),
  `status` ENUM('pending', 'approved', 'claimed', 'returned', 'rejected') DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `found_item_images` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `found_item_id` INT NOT NULL,
  `image_url` VARCHAR(255) NOT NULL,
  `is_primary` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`found_item_id`) REFERENCES `found_items`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `lost_items` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `firestore_id` VARCHAR(100),
  `item_name` VARCHAR(100) NOT NULL,
  `category_id` INT NOT NULL,
  `description` VARCHAR(255),
  `last_seen_location` VARCHAR(100) NOT NULL,
  `lost_date` DATE NOT NULL,
  `image_url` VARCHAR(255),
  `status` ENUM('active', 'found', 'closed') DEFAULT 'active',
  `reward` VARCHAR(100),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `item_claims` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `item_id` INT NOT NULL,
  `description` TEXT NOT NULL,
  `lost_location` VARCHAR(100),
  `lost_date` DATE,
  `additional_proof` TEXT,
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  `admin_notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`item_id`) REFERENCES `found_items`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `title` VARCHAR(100) NOT NULL,
  `message` TEXT NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `reference_id` INT,
  `reference_type` VARCHAR(50),
  `is_read` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `feedback` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `item_id` INT NOT NULL,
  `rating` INT NOT NULL,
  `comment` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`item_id`) REFERENCES `found_items`(`id`) ON DELETE CASCADE
);

INSERT INTO `categories` (`name`, `description`, `icon`, `priority`) VALUES
('Dompet/Tas', 'Dompet, tas, ransel, dan barang sejenis', 'wallet', 1),
('Elektronik', 'Handphone, laptop, charger, dan perangkat elektronik lainnya', 'smartphone', 2),
('Kartu Identitas', 'KTM, KTP, SIM, dan kartu identitas lainnya', 'credit-card', 3),
('Kunci', 'Kunci motor, mobil, rumah, dan sejenisnya', 'key', 4),
('Buku/ATK', 'Buku, catatan, alat tulis, dan perlengkapan kuliah', 'book', 5),
('Aksesoris', 'Jam tangan, kacamata, perhiasan, dan aksesoris lainnya', 'watch', 6),
('Pakaian', 'Jaket, topi, sepatu, dan pakaian lainnya', 'shirt', 7),
('Lainnya', 'Barang lain yang tidak termasuk kategori di atas', 'package', 8);