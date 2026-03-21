-- ============================================================
--  Course Boo — Database Init Script
--  รันอัตโนมัติตอน docker-compose up ครั้งแรก
--  ลำดับสร้างตาราง: ต้นทาง FK ก่อน → ปลายทาง FK หลัง
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
SET NAMES utf8mb4;

-- ============================================================
--  1. instructors — ไม่มี FK ขึ้นกับใคร
-- ============================================================
CREATE TABLE IF NOT EXISTS `instructors` (
  `id`         int          NOT NULL AUTO_INCREMENT,
  `firstname`  varchar(255) NOT NULL,
  `lastname`   varchar(255) NOT NULL,
  `email`      varchar(255) NOT NULL,
  `created_at` timestamp    NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================
--  2. students — ไม่มี FK ขึ้นกับใคร
-- ============================================================
CREATE TABLE IF NOT EXISTS `students` (
  `id`         int          NOT NULL AUTO_INCREMENT,
  `firstname`  varchar(255) NOT NULL,
  `lastname`   varchar(255) NOT NULL,
  `email`      varchar(255) NOT NULL,
  `created_at` timestamp    NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================
--  3. users — ไม่มี FK ขึ้นกับใคร (login ครู/นักเรียน)
-- ============================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id`         int                        NOT NULL AUTO_INCREMENT,
  `email`      varchar(255)               NOT NULL,
  `password`   varchar(255)               NOT NULL,
  `role`       enum('teacher','student')  NOT NULL,
  `created_at` timestamp                  NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================
--  4. courses — FK → instructors
-- ============================================================
CREATE TABLE IF NOT EXISTS `courses` (
  `id`            int          NOT NULL AUTO_INCREMENT,
  `title`         varchar(255) NOT NULL,
  `description`   text,
  `instructor_id` int          NOT NULL,
  `created_at`    timestamp    NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_instructor` (`instructor_id`),
  CONSTRAINT `fk_instructor`
    FOREIGN KEY (`instructor_id`) REFERENCES `instructors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================
--  5. enrollments — FK → students, courses
-- ============================================================
CREATE TABLE IF NOT EXISTS `enrollments` (
  `id`          int         NOT NULL AUTO_INCREMENT,
  `student_id`  int         NOT NULL,
  `course_id`   int         NOT NULL,
  `enrolled_at` timestamp   NULL DEFAULT CURRENT_TIMESTAMP,
  `status`      varchar(20) DEFAULT 'approved',  -- approved | pending | rejected
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_enrollment` (`student_id`,`course_id`),
  KEY `course_id` (`course_id`),
  CONSTRAINT `enrollments_ibfk_1`
    FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `enrollments_ibfk_2`
    FOREIGN KEY (`course_id`)  REFERENCES `courses`  (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================
--  6. lessons — FK → courses
-- ============================================================
CREATE TABLE IF NOT EXISTS `lessons` (
  `id`           int          NOT NULL AUTO_INCREMENT,
  `course_id`    int          NOT NULL,
  `title`        varchar(255) NOT NULL,
  `content`      text,
  `order_number` int          NOT NULL,
  `video_url`    varchar(500) DEFAULT NULL,
  `file_url`     varchar(500) DEFAULT NULL,
  `created_at`   timestamp    NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `course_id` (`course_id`),
  CONSTRAINT `lessons_ibfk_1`
    FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================
--  7. progress — FK → students, lessons
-- ============================================================
CREATE TABLE IF NOT EXISTS `progress` (
  `id`           int        NOT NULL AUTO_INCREMENT,
  `student_id`   int        NOT NULL,
  `lesson_id`    int        NOT NULL,
  `is_completed` tinyint(1) DEFAULT '0',   -- 0=กำลังเรียน, 1=จบแล้ว
  `completed_at` timestamp  NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_progress` (`student_id`,`lesson_id`),  -- กันบันทึกซ้ำ
  KEY `lesson_id` (`lesson_id`),
  CONSTRAINT `progress_ibfk_1`
    FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `progress_ibfk_2`
    FOREIGN KEY (`lesson_id`)  REFERENCES `lessons`  (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================
--  8. quizzes — FK → lessons
-- ============================================================
CREATE TABLE IF NOT EXISTS `quizzes` (
  `id`         int                     NOT NULL AUTO_INCREMENT,
  `lesson_id`  int                     NOT NULL,
  `question`   text                    NOT NULL,
  `choice_a`   varchar(255)            NOT NULL,
  `choice_b`   varchar(255)            NOT NULL,
  `choice_c`   varchar(255)            NOT NULL,
  `choice_d`   varchar(255)            NOT NULL,
  `answer`     enum('a','b','c','d')   NOT NULL,
  `created_at` timestamp               NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `lesson_id` (`lesson_id`),
  CONSTRAINT `quizzes_ibfk_1`
    FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================
--  9. quiz_results — FK → students, quizzes
-- ============================================================
CREATE TABLE IF NOT EXISTS `quiz_results` (
  `id`              int                   NOT NULL AUTO_INCREMENT,
  `student_id`      int                   NOT NULL,
  `quiz_id`         int                   NOT NULL,
  `selected_answer` enum('a','b','c','d') NOT NULL,
  `is_correct`      tinyint(1)            DEFAULT '0',
  `created_at`      timestamp             NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_result` (`student_id`,`quiz_id`),  -- ทำได้ครั้งเดียวต่อข้อ
  KEY `quiz_id` (`quiz_id`),
  CONSTRAINT `quiz_results_ibfk_1`
    FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `quiz_results_ibfk_2`
    FOREIGN KEY (`quiz_id`)    REFERENCES `quizzes`  (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================
--  Seed Data — account เริ่มต้นสำหรับทดสอบ
--  (ลบออกได้ถ้าไม่ต้องการ data ตัวอย่าง)
-- ============================================================
INSERT IGNORE INTO `users` (`email`, `password`, `role`) VALUES
  ('teacher@school.com', '1234', 'teacher'),
  ('student@school.com', '1234', 'student');