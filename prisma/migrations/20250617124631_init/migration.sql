-- CreateTable
CREATE TABLE `companies` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `region` VARCHAR(100) NOT NULL,
    `industry` VARCHAR(255) NULL,
    `contact_email` VARCHAR(255) NULL,
    `contact_phone` VARCHAR(20) NULL,
    `geofence_latitude` DECIMAL(10, 8) NULL,
    `geofence_longitude` DECIMAL(11, 8) NULL,
    `geofence_radius_meters` INTEGER NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `name`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `company_supervisors` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `company_id` INTEGER NOT NULL,
    `job_title` VARCHAR(100) NULL,

    UNIQUE INDEX `user_id`(`user_id`),
    INDEX `company_id`(`company_id`),
    INDEX `idx_company_supervisors_user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `daily_reports` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `internship_id` INTEGER NOT NULL,
    `report_date` DATE NOT NULL,
    `summary_of_work` TEXT NOT NULL,
    `submission_timestamp` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `company_supervisor_feedback` TEXT NULL,
    `lecturer_feedback` TEXT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'pending_review',
    `approved_by_supervisor_id` INTEGER NULL,
    `approved_timestamp` TIMESTAMP(0) NULL,
    `last_update_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `related_task_ids` LONGTEXT NULL,

    INDEX `approved_by_supervisor_id`(`approved_by_supervisor_id`),
    INDEX `idx_daily_reports_internship_id`(`internship_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `daily_tasks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `internship_id` INTEGER NOT NULL,
    `task_date` DATE NOT NULL,
    `description` TEXT NOT NULL,
    `expected_outcome` TEXT NULL,
    `learning_objective` TEXT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_daily_tasks_internship_id`(`internship_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `departments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `faculty_id` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `hod_id` INTEGER NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `update_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `faculty_id, name`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `faculties` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `name`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `feedbacks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `from_user_id` INTEGER NOT NULL,
    `to_user_id` INTEGER NOT NULL,
    `internship_id` INTEGER NULL,
    `feedback_type` VARCHAR(50) NOT NULL,
    `content` TEXT NOT NULL,
    `sent_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `is_read` BOOLEAN NOT NULL DEFAULT false,

    INDEX `idx_feedbacks_from_user_id`(`from_user_id`),
    INDEX `idx_feedbacks_to_user_id`(`to_user_id`),
    INDEX `internship_id`(`internship_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `internships` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_id` INTEGER NOT NULL,
    `company_id` INTEGER NOT NULL,
    `company_supervisor_id` INTEGER NOT NULL,
    `lecturer_id` INTEGER NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `student_id`(`student_id`),
    INDEX `company_id`(`company_id`),
    INDEX `company_supervisor_id`(`company_supervisor_id`),
    INDEX `idx_internships_student_id`(`student_id`),
    INDEX `lecturer_id`(`lecturer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lecturers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `staff_id_number` VARCHAR(50) NULL,
    `faculty_id` INTEGER NOT NULL,
    `department_id` INTEGER NOT NULL,
    `region` VARCHAR(100) NULL,

    UNIQUE INDEX `staff_id_number`(`staff_id_number`),
    INDEX `department_id`(`department_id`),
    INDEX `faculty_id`(`faculty_id`),
    INDEX `idx_lecturers_user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `location_check_ins` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `internship_id` INTEGER NOT NULL,
    `check_in_timestamp` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `latitude` DECIMAL(10, 8) NOT NULL,
    `longitude` DECIMAL(11, 8) NOT NULL,
    `is_within_geofence` BOOLEAN NOT NULL,
    `device_info` TEXT NULL,

    INDEX `internship_id`(`internship_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_attachements` (
    `id` INTEGER NOT NULL,
    `report_id` INTEGER NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `file_type` VARCHAR(50) NULL,
    `file_path` VARCHAR(500) NOT NULL,
    `uploaded_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `report_id`(`report_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `students` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `student_id_number` VARCHAR(50) NULL,
    `faculty_id` INTEGER NOT NULL,
    `department_id` INTEGER NOT NULL,
    `program_of_study` VARCHAR(255) NULL,
    `is_verified` BOOLEAN NULL DEFAULT false,
    `profile_complete` BOOLEAN NULL DEFAULT false,

    UNIQUE INDEX `user_id`(`user_id`),
    UNIQUE INDEX `student_id_number`(`student_id_number`),
    INDEX `department_id`(`department_id`),
    INDEX `faculty_id`(`faculty_id`),
    INDEX `idx_students_user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` VARCHAR(50) NOT NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `phone_number` VARCHAR(20) NULL,
    `is_active` BOOLEAN NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `update_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `email`(`email`),
    INDEX `idx_users_email`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `company_supervisors` ADD CONSTRAINT `company_supervisors_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `company_supervisors` ADD CONSTRAINT `company_supervisors_ibfk_2` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `daily_reports` ADD CONSTRAINT `daily_reports_ibfk_1` FOREIGN KEY (`internship_id`) REFERENCES `internships`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `daily_reports` ADD CONSTRAINT `daily_reports_ibfk_2` FOREIGN KEY (`approved_by_supervisor_id`) REFERENCES `company_supervisors`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `daily_tasks` ADD CONSTRAINT `daily_tasks_ibfk_1` FOREIGN KEY (`internship_id`) REFERENCES `internships`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `feedbacks` ADD CONSTRAINT `feedbacks_ibfk_1` FOREIGN KEY (`from_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `feedbacks` ADD CONSTRAINT `feedbacks_ibfk_2` FOREIGN KEY (`to_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `feedbacks` ADD CONSTRAINT `feedbacks_ibfk_3` FOREIGN KEY (`internship_id`) REFERENCES `internships`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `internships` ADD CONSTRAINT `internships_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `internships` ADD CONSTRAINT `internships_ibfk_2` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `internships` ADD CONSTRAINT `internships_ibfk_3` FOREIGN KEY (`company_supervisor_id`) REFERENCES `company_supervisors`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `internships` ADD CONSTRAINT `internships_ibfk_4` FOREIGN KEY (`lecturer_id`) REFERENCES `lecturers`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `lecturers` ADD CONSTRAINT `lecturers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `lecturers` ADD CONSTRAINT `lecturers_ibfk_2` FOREIGN KEY (`faculty_id`) REFERENCES `faculties`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `lecturers` ADD CONSTRAINT `lecturers_ibfk_3` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `location_check_ins` ADD CONSTRAINT `location_check_ins_ibfk_1` FOREIGN KEY (`internship_id`) REFERENCES `internships`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `report_attachements` ADD CONSTRAINT `report_attachements_ibfk_1` FOREIGN KEY (`report_id`) REFERENCES `daily_reports`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_ibfk_2` FOREIGN KEY (`faculty_id`) REFERENCES `faculties`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_ibfk_3` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
