-- CreateTable
CREATE TABLE `board_cards` (
    `id` CHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` LONGTEXT NULL,
    `parent_list` CHAR(36) NOT NULL,
    `position` INTEGER NOT NULL,
    `created_by` CHAR(36) NOT NULL,
    `assigned_to` CHAR(36) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    INDEX `board_cards_parent_list_foreign`(`parent_list`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `board_invitations` (
    `id` CHAR(36) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `parent_board` VARCHAR(255) NOT NULL,
    `created_by` CHAR(36) NOT NULL,
    `role` CHAR(6) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    INDEX `board_invitations_parent_board_foreign`(`parent_board`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `board_labels` (
    `id` CHAR(36) NOT NULL,
    `label` VARCHAR(255) NOT NULL,
    `color` VARCHAR(255) NOT NULL,
    `created_by` VARCHAR(255) NOT NULL,
    `parent_board` CHAR(36) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    INDEX `board_labels_parent_board_foreign`(`parent_board`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `board_lists` (
    `id` CHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `position` INTEGER NOT NULL,
    `created_by` VARCHAR(255) NOT NULL,
    `hide_when_blank` BOOLEAN NOT NULL DEFAULT false,
    `parent_board` CHAR(36) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    INDEX `board_lists_parent_board_foreign`(`parent_board`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `board_members` (
    `id` CHAR(36) NOT NULL,
    `parent_board` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `role` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    INDEX `board_members_parent_board_foreign`(`parent_board`),
    INDEX `board_members_user_id_foreign`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `boards` (
    `id` CHAR(36) NOT NULL,
    `owner_id` CHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` VARCHAR(255) NULL,
    `background` VARCHAR(255) NOT NULL,
    `background_type` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,
    `background_credits` VARCHAR(255) NULL,

    INDEX `boards_owner_id_foreign`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `card_labels` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `card_id` CHAR(36) NOT NULL,
    `label_id` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    INDEX `card_labels_label_id_foreign`(`label_id`),
    UNIQUE INDEX `card_labels_card_id_label_id_unique`(`card_id`, `label_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `full_name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(254) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `users_email_unique`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `board_cards` ADD CONSTRAINT `board_cards_parent_list_foreign` FOREIGN KEY (`parent_list`) REFERENCES `board_lists`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `board_invitations` ADD CONSTRAINT `board_invitations_parent_board_foreign` FOREIGN KEY (`parent_board`) REFERENCES `boards`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `board_labels` ADD CONSTRAINT `board_labels_parent_board_foreign` FOREIGN KEY (`parent_board`) REFERENCES `boards`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `board_lists` ADD CONSTRAINT `board_lists_parent_board_foreign` FOREIGN KEY (`parent_board`) REFERENCES `boards`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `board_members` ADD CONSTRAINT `board_members_parent_board_foreign` FOREIGN KEY (`parent_board`) REFERENCES `boards`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `board_members` ADD CONSTRAINT `board_members_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `boards` ADD CONSTRAINT `boards_owner_id_foreign` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `card_labels` ADD CONSTRAINT `card_labels_card_id_foreign` FOREIGN KEY (`card_id`) REFERENCES `board_cards`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `card_labels` ADD CONSTRAINT `card_labels_label_id_foreign` FOREIGN KEY (`label_id`) REFERENCES `board_labels`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;
