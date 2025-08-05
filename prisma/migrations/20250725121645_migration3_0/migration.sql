/*
  Warnings:

  - You are about to drop the column `geofence_latitude` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `geofence_longitude` on the `companies` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `companies` DROP COLUMN `geofence_latitude`,
    DROP COLUMN `geofence_longitude`,
    ADD COLUMN `latitude` DOUBLE NULL,
    ADD COLUMN `longitude` DOUBLE NULL;

-- CreateTable
CREATE TABLE `pending_students` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_id_number` VARCHAR(50) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `faculty_id` INTEGER NOT NULL,
    `department_id` INTEGER NOT NULL,
    `program_of_study` VARCHAR(255) NULL,
    `is_verified` BOOLEAN NOT NULL DEFAULT false,
    `added_by_admin_id` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `pending_students_student_id_number_key`(`student_id_number`),
    UNIQUE INDEX `pending_students_email_key`(`email`),
    INDEX `idx_pending_students_faculty`(`faculty_id`),
    INDEX `idx_pending_students_department`(`department_id`),
    INDEX `idx_pending_students_email`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `otp_verifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `otp_code` VARCHAR(10) NOT NULL,
    `purpose` VARCHAR(50) NOT NULL,
    `expires_at` TIMESTAMP(0) NOT NULL,
    `is_used` BOOLEAN NOT NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_otp_email_purpose`(`email`, `purpose`),
    INDEX `idx_otp_expires`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pending_internships` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_id` INTEGER NOT NULL,
    `company_name` VARCHAR(100) NOT NULL,
    `company_address` VARCHAR(200) NOT NULL,
    `supervisor_name` VARCHAR(100) NOT NULL,
    `supervisor_email` VARCHAR(255) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `location` VARCHAR(100) NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'PENDING_APPROVAL',
    `rejection_reason` TEXT NULL,
    `submitted_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `reviewed_at` TIMESTAMP(0) NULL,
    `reviewed_by` INTEGER NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `student_id`(`student_id`),
    INDEX `idx_pending_internships_student_id`(`student_id`),
    INDEX `idx_pending_internships_status`(`status`),
    INDEX `idx_pending_internships_reviewed_by`(`reviewed_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `pending_students` ADD CONSTRAINT `pending_students_faculty_id_fkey` FOREIGN KEY (`faculty_id`) REFERENCES `faculties`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pending_students` ADD CONSTRAINT `pending_students_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pending_students` ADD CONSTRAINT `pending_students_added_by_admin_id_fkey` FOREIGN KEY (`added_by_admin_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pending_internships` ADD CONSTRAINT `pending_internships_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `pending_internships` ADD CONSTRAINT `pending_internships_ibfk_2` FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
