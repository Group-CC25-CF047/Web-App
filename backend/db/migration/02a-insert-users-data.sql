-- 02a-insert-users-data.sql

/*
 * Sample User Data Insertion
 *
 * Description:
 *   Initial seed data for testing and development
 *
 * SQL Explanation:
 *   - INSERT statements add initial records to the users table
 *   - Uses bcrypt hashed passwords for security
 *   - Creates both client and admin users for testing different permissions
 */
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'john.doe@example.com') THEN
        INSERT INTO users (first_name, last_name, password, email, role, photo)
        VALUES ('John', 'Doe', '$2a$10$yJQbUq1jErn60OJ75fxRbuxtw5DjWGz9fRNmH54/mjd3s4kCzJ2be', 'john.doe@example.com', 'client', 'https://storage.googleapis.com/iotunnel-storage/default.jpg');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'jane.doe@example.com') THEN
        INSERT INTO users (first_name, last_name, password, email, role, photo)
        VALUES ('Jane', 'Doe', '$2a$10$yJQbUq1jErn60OJ75fxRbuxtw5DjWGz9fRNmH54/mjd3s4kCzJ2be', 'jane.doe@example.com', 'admin', 'https://storage.googleapis.com/iotunnel-storage/default.jpg');
    END IF;
END $$;