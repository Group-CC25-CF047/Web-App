-- 02-create-users-table.sql

/* 
 * Users Table and Associated Objects
 *
 * This script creates the `users` table, along with associated indexes,
 * a custom ENUM type, trigger, and functions for soft deletion.
 */

/* 
 * Custom ENUM Type: user_role
 *
 * Description:
 *   Defines the possible roles a user can have within the system.
 *
 * SQL Explanation:
 *   - Creates a custom ENUM type that restricts possible values to a predefined set
 *   - Provides type safety by ensuring only valid role values can be assigned
 *   - More efficient than using VARCHAR with CHECK constraints
 *
 * Values:
 *   - client:    Standard client with basic privileges.
 *   - admin:     Administrator with full access.
 *   - moderator: Moderator with elevated privileges, but less than admin.
 */
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('client', 'admin', 'moderator');
    END IF;
END $$;

/*
 * Table: users
 *
 * Description:
 *   Stores information about users in the system.  Implements soft deletes
 *   using the `is_deleted` column.
 *
 * SQL Explanation:
 *   - Creates a table with UUID PRIMARY KEY for better scalability and to avoid collisions
 *   - Uses gen_random_uuid() function to automatically generate UUIDs for new users
 *   - Includes timestamp fields for tracking record creation and modification
 *   - Uses soft deletion pattern with is_deleted boolean flag
 *
 * Columns:
 *   - id (UUID PRIMARY KEY DEFAULT gen_random_uuid()): Unique identifier for
 *     each user. Uses UUIDs for better scalability and to avoid collisions.
 *   - first_name (VARCHAR(255) NOT NULL): The user's first name.
 *   - last_name (VARCHAR(255) DEFAULT ' '): The user's last name (optional).
 *   - password (VARCHAR(255) NOT NULL): The user's *hashed* password.  Never
 *     store passwords in plain text.
 *   - email (VARCHAR(255) UNIQUE NOT NULL): The user's email address (unique).
 *   - role (user_role NOT NULL): The user's role (see user_role ENUM).
 *   - photo (TEXT): URL or path to the user's photo (optional).
 *   - created_at (TIMESTAMP WITH TIME ZONE DEFAULT NOW()): Timestamp of when
 *     the user record was created.
 *   - updated_at (TIMESTAMP WITH TIME ZONE DEFAULT NOW()): Timestamp of the last update to
 *     the user record.  Automatically updated by the
 *     `update_users_updated_at` trigger.
 *   - is_deleted (BOOLEAN NOT NULL DEFAULT FALSE): Flag indicating whether the
 *     user has been soft-deleted.
 *   - created_by (UUID): ID of the user who created this record.
 *   - updated_by (UUID): ID of the user who last updated this record.
 */
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) DEFAULT ' ',
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL,
    photo TEXT,
    Description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID,
    updated_by UUID
);

/* 
 * Column Documentation
 * 
 * SQL Explanation:
 *   - COMMENT statements add metadata to database objects
 *   - This metadata is visible in database administration tools
 *   - Comments do not affect database performance or functionality
 */
COMMENT ON COLUMN users.id IS 'Unique identifier for each user';
COMMENT ON COLUMN users.first_name IS 'User''s first name';
COMMENT ON COLUMN users.last_name IS 'User''s last name (optional)';
COMMENT ON COLUMN users.password IS 'User''s hashed password - never store in plain text';
COMMENT ON COLUMN users.email IS 'User''s email address - must be unique';
COMMENT ON COLUMN users.role IS 'User''s role in the system (client, admin, or moderator)';
COMMENT ON COLUMN users.photo IS 'URL or path to the user''s profile photo (optional)';
COMMENT ON COLUMN users.created_at IS 'Timestamp when the user record was created';
COMMENT ON COLUMN users.updated_at IS 'Timestamp of the last update to the user record';
COMMENT ON COLUMN users.is_deleted IS 'Flag indicating whether the user has been soft-deleted';
COMMENT ON COLUMN users.created_by IS 'ID of the user who created this record';
COMMENT ON COLUMN users.updated_by IS 'ID of the user who last updated this record';

/* 
 * Validation Constraints
 * 
 * SQL Explanation:
 *   - Adds additional CHECK constraints to ensure data integrity
 *   - Each constraint creates a rule that must be satisfied for data to be accepted
 *   - Enforces business rules at the database level rather than application level
 */
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_first_name_not_whitespace') THEN
        ALTER TABLE users ADD CONSTRAINT check_first_name_not_whitespace 
          CHECK (TRIM(first_name) <> '');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_password_minimum_length') THEN
        ALTER TABLE users ADD CONSTRAINT check_password_minimum_length 
          CHECK (LENGTH(password) >= 60); /* Appropriate for bcrypt hashes */
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_password_not_email') THEN
        ALTER TABLE users ADD CONSTRAINT check_password_not_email 
          CHECK (password <> email);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_email_format') THEN
        ALTER TABLE users ADD CONSTRAINT check_email_format
          CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    END IF;
END $$;

/*
 * Indexes on the users table
 *
 * Description:
 * These indexes improve query performance on frequently accessed columns.
 * Uses B-tree indexes for all columns as it's the most compatible option
 * - B-tree: For columns used in range queries, ordering, and equality conditions
 * Conditional unique indexes ensure uniqueness for active users only.
 *
 * SQL Explanation:
 *   - Creates indexes on columns commonly used in WHERE, JOIN, and ORDER BY clauses
 *   - Creates a conditional unique index that only applies to non-deleted users
 *   - Each CREATE INDEX statement builds a separate database structure that speeds up lookups
 *   - Indexes require additional storage but significantly improve query speed
 *
 * Indexes:
 *   - idx_users_email_unique: Unique B-tree index on email for non-deleted users.
 *   - idx_users_first_name: B-tree index on first_name for partial text searches and sorting.
 *   - idx_users_last_name: B-tree index on last_name for partial text searches and sorting.
 *   - idx_users_role: B-tree index on role for role lookups.
 *   - idx_users_created_at: B-tree index on created_at for timestamp range queries.
 */
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_email_unique') THEN
        CREATE UNIQUE INDEX idx_users_email_unique ON users (email) WHERE is_deleted = FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_first_name') THEN
        CREATE INDEX idx_users_first_name ON users (first_name);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_last_name') THEN
        CREATE INDEX idx_users_last_name ON users (last_name);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_role') THEN
        CREATE INDEX idx_users_role ON users (role);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_created_at') THEN
        CREATE INDEX idx_users_created_at ON users (created_at);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_is_deleted') THEN
        CREATE INDEX idx_users_is_deleted ON users (is_deleted);
    END IF;
END $$;

/*
 * Trigger: update_users_updated_at_update
 *
 * Description:
 *   Automatically updates the `updated_at` column to the current timestamp
 *   whenever a row in the `users` table is updated.
 *
 * SQL Explanation:
 *   - BEFORE UPDATE trigger executes prior to the actual update operation
 *   - FOR EACH ROW means it runs once for every row affected by the UPDATE
 *   - Calls update_column_updated_at() function to set the current timestamp
 *
 *   - BEFORE UPDATE: The trigger fires before the update operation occurs.
 *   - FOR EACH ROW: The trigger executes for each row affected by the update.
 *   - EXECUTE FUNCTION update_column_updated_at(): Calls the
 *     `update_column_updated_at` function (defined separately) to perform
 *     the actual update of the `updated_at` column.
 */
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at_update') THEN
        CREATE TRIGGER update_users_updated_at_update
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_column_updated_at();
    END IF;
END $$;

/*
 * Trigger: update_users_updated_at_insert
 *
 * Description:
 *   Automatically updates the `updated_at` column to the current timestamp
 *   whenever a row is inserted into the `users` table.
 *
 * SQL Explanation:
 *   - BEFORE INSERT trigger executes prior to the actual insert operation
 *   - FOR EACH ROW means it runs once for every row affected by the INSERT
 *   - Calls update_column_updated_at() function to set the current timestamp
 *
 *   - BEFORE INSERT: The trigger fires before the insert operation occurs.
 *   - FOR EACH ROW: The trigger executes for each row being inserted.
 *   - EXECUTE FUNCTION update_column_updated_at(): Calls the
 *     `update_column_updated_at` function (defined separately) to perform
 *     the actual update of the `updated_at` column.
 */
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at_insert') THEN
        CREATE TRIGGER update_users_updated_at_insert 
        BEFORE INSERT ON users 
        FOR EACH ROW
        EXECUTE FUNCTION update_column_updated_at();
    END IF;
END $$;

/* 
 * User Audit Log Table
 *
 * Description:
 *   Tracks changes to user data for compliance and security purposes.
 *
 * SQL Explanation:
 *   - Creates a separate audit table with a foreign key to users(id)
 *   - Uses JSONB data type for flexible storage of changed field data
 *   - Includes timestamp and user tracking for complete audit trail
 */
CREATE TABLE IF NOT EXISTS user_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    changed_fields JSONB,
    changed_by UUID,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

/* Add foreign key with IF NOT EXISTS check */
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_audit_log_user_id_fkey') THEN
        ALTER TABLE user_audit_log 
        ADD CONSTRAINT user_audit_log_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id);
    END IF;
END $$;

/* 
 * Audit Log Column Documentation
 *
 * SQL Explanation:
 *   - COMMENT statements add metadata to database objects
 *   - This metadata is visible in database administration tools
 *   - Comments do not affect database performance or functionality
 */
COMMENT ON TABLE user_audit_log IS 'Audit log for tracking changes to user data';
COMMENT ON COLUMN user_audit_log.id IS 'Unique identifier for the audit log entry';
COMMENT ON COLUMN user_audit_log.user_id IS 'ID of the user whose data was changed';
COMMENT ON COLUMN user_audit_log.action IS 'Type of action performed (create, update, delete, login, etc.)';
COMMENT ON COLUMN user_audit_log.changed_fields IS 'JSON object containing the changed fields and their values';
COMMENT ON COLUMN user_audit_log.changed_by IS 'ID of the user who made the change';
COMMENT ON COLUMN user_audit_log.timestamp IS 'Timestamp when the change occurred';

/* 
 * Audit Log Indexes
 *
 * SQL Explanation:
 *   - Creates B-tree indexes to speed up queries against the audit log
 *   - Improves performance for filtering by user_id, timestamp, or action type
 *   - Each index consumes storage space but optimizes query execution plans
 */
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_audit_log_user_id') THEN
        CREATE INDEX idx_user_audit_log_user_id ON user_audit_log(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_audit_log_timestamp') THEN
        CREATE INDEX idx_user_audit_log_timestamp ON user_audit_log(timestamp);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_audit_log_action') THEN
        CREATE INDEX idx_user_audit_log_action ON user_audit_log(action);
    END IF;
END $$;

/*
 * Function: log_user_change
 *
 * Description:
 *   Records changes to user data in the audit log
 *   Automatically captures user changes and stores them in the audit log
 *   with proper attribution of who made the changes
 *
 * SQL Explanation:
 *   - Creates a PL/pgSQL function that returns TRIGGER
 *   - Uses TG_OP to detect operation type (INSERT, UPDATE, DELETE)
 *   - Builds JSONB objects to store changed fields
 *   - Retrieves current user ID from session settings
 *   - Handles exceptions for missing user ID
 *   - Inserts a new record in user_audit_log table
 */
CREATE OR REPLACE FUNCTION log_user_change()
RETURNS TRIGGER AS $$
DECLARE
    changed_data JSONB;
    action_type VARCHAR(50);
    current_user_id UUID;
BEGIN
    BEGIN
        current_user_id := NULLIF(current_setting('app.user_id', TRUE), '')::UUID;
    EXCEPTION WHEN OTHERS THEN
        current_user_id := NULL;
    END;

    IF TG_OP = 'INSERT' THEN
        action_type := 'create';
        changed_data := to_jsonb(NEW);
        changed_data := changed_data - 'password';
        
        IF current_user_id IS NULL THEN
            current_user_id := NEW.id;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        action_type := 'update';
        changed_data := jsonb_build_object();
        
        IF OLD.first_name IS DISTINCT FROM NEW.first_name THEN
            changed_data := changed_data || jsonb_build_object('first_name', NEW.first_name);
        END IF;
        
        IF OLD.last_name IS DISTINCT FROM NEW.last_name THEN
            changed_data := changed_data || jsonb_build_object('last_name', NEW.last_name);
        END IF;
        
        IF OLD.email IS DISTINCT FROM NEW.email THEN
            changed_data := changed_data || jsonb_build_object('email', NEW.email);
        END IF;
        
        IF OLD.role IS DISTINCT FROM NEW.role THEN
            changed_data := changed_data || jsonb_build_object('role', NEW.role);
        END IF;
        
        IF OLD.is_deleted IS DISTINCT FROM NEW.is_deleted THEN
            changed_data := changed_data || jsonb_build_object('is_deleted', NEW.is_deleted);
        END IF;
        
        IF OLD.photo IS DISTINCT FROM NEW.photo THEN
            changed_data := changed_data || jsonb_build_object('photo', NEW.photo);
        END IF;
        
        IF OLD.password IS DISTINCT FROM NEW.password THEN
            changed_data := changed_data || jsonb_build_object('password_changed', true);
        END IF;
        
        IF current_user_id IS NULL THEN
            current_user_id := NEW.id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        action_type := 'delete';
        changed_data := to_jsonb(OLD);
        changed_data := changed_data - 'password';
        
        IF current_user_id IS NULL THEN
            current_user_id := OLD.id;
        END IF;
    END IF;
    
    INSERT INTO user_audit_log (
        user_id, 
        action, 
        changed_fields, 
        changed_by
    ) VALUES (
        CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
        action_type,
        changed_data,
        current_user_id 
    );
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

/* 
 * User Audit Trigger
 *
 * Description:
 *   Activates the log_user_change function whenever users are modified
 *
 * SQL Explanation:
 *   - AFTER trigger fires after the database operation completes
 *   - Fires on INSERT, UPDATE, or DELETE operations
 *   - Executes log_user_change() function for each affected row
 */
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'user_audit_trigger') THEN
        CREATE TRIGGER user_audit_trigger
        AFTER INSERT OR UPDATE OR DELETE ON users
        FOR EACH ROW EXECUTE FUNCTION log_user_change();
    END IF;
END $$;

/*
 * Function: set_user_timestamps
 *
 * Description:
 *   Automatically tracks who created and modified user records
 *
 * SQL Explanation:
 *   - Creates a BEFORE trigger function for INSERT and UPDATE operations
 *   - Gets current user ID from session context
 *   - Assigns appropriate user IDs to created_by and updated_by fields
 *   - Uses NULLIF to handle cases where no user ID is set
 */
CREATE OR REPLACE FUNCTION set_user_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.created_by := NULLIF(current_setting('app.user_id', TRUE), '')::UUID;
    ELSIF TG_OP = 'UPDATE' THEN
        NEW.updated_by := NULLIF(current_setting('app.user_id', TRUE), '')::UUID;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

/* 
 * User Tracking Trigger
 *
 * Description:
 *   Automatically populates created_by and updated_by fields
 *
 * SQL Explanation:
 *   - BEFORE trigger executes before the database operation
 *   - Applies to both INSERT and UPDATE operations
 *   - Calls set_user_timestamps() function for each row
 */
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'user_tracking_trigger') THEN
        CREATE TRIGGER user_tracking_trigger
        BEFORE INSERT OR UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION set_user_timestamps();
    END IF;
END $$;

/* Sample data for this table has been moved to 02a-insert-users-data.sql */
