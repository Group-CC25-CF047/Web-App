-- 01-create-updates-trigger.sql

/*
 * Automatic Timestamp Update Function
 *
 * This script creates a trigger function that automatically updates timestamps
 * for tables with an updated_at column.
 */

/*
 * Function: update_column_updated_at
 *
 * Description:
 *   This function automatically updates the `updated_at` column of a table
 *   to the current timestamp whenever a row in that table is updated.
 *
 * SQL Explanation:
 *   - Creates a PL/pgSQL function that returns TRIGGER
 *   - Sets the NEW.updated_at value to now() (current timestamp)
 *   - Returns NEW to allow the update operation to proceed with the updated timestamp
 *   - Designed to be used with BEFORE UPDATE triggers
 *
 * Return Type: TRIGGER
 *
 * Usage:
 *   This function should be associated with a BEFORE UPDATE trigger on any
 *   table that has an `updated_at` column of type TIMESTAMP WITH TIME ZONE.
 *
 * Example Trigger Creation:
 *   CREATE TRIGGER update_mytable_updated_at
 *   BEFORE UPDATE ON mytable
 *   FOR EACH ROW
 *   EXECUTE FUNCTION update_column_updated_at();
 */

CREATE OR REPLACE FUNCTION update_column_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;