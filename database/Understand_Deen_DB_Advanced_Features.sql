-- ==============================================================================
-- Understand Deen Web App — Advanced Database Features
-- Course Evaluation Script: Triggers, Functions, and Transactions
-- ==============================================================================
-- PURPOSE:
--   This script implements the advanced programmable objects required for 
--   the project evaluation. 
--
-- ARCHITECTURAL NOTE ON FOREIGN KEYS:
--   Our base schema utilizes `ON DELETE CASCADE` from Users to all child tables 
--   (Bookmarks, Habits, Progress). We intentionally OMITTED `ON UPDATE CASCADE` 
--   because our Primary Keys are INT IDENTITY(1,1). SQL Server prohibits updating 
--   identity columns, rendering update cascades unnecessary. Furthermore, our 
--   schema is a "Hub and Spoke" model, completely avoiding the multiple-cascade 
--   "Diamond Problem."
-- ==============================================================================

USE UnderstandDeenDB;
GO

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. DATABASE TRIGGER (Automated Preference Creation)
-- ──────────────────────────────────────────────────────────────────────────────
-- When a new user registers, they should instantly have default preferences.
-- Instead of doing this in the Node.js backend, we use a database trigger to 
-- guarantee data integrity at the lowest level.

CREATE OR ALTER TRIGGER trg_AfterUserInsert
ON Users
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON; -- command to stop SQL server from sending lines affected messages in terminal
    -- below. Standard best practise in stored procedures, transactions, etc.
    -- Automatically insert default UI preferences for every new UserID
    INSERT INTO User_Preferences (UserID, ThemeMode, ArabicFont, TranslationLang)
    SELECT inserted.UserID, 'light', 'Uthmani', 'en'
    FROM inserted;
    
    PRINT 'Trigger [trg_AfterUserInsert]: Default user preferences created.';
END;
GO

-- ──────────────────────────────────────────────────────────────────────────────
-- TRIGGER (Security / Data Integrity)
-- ──────────────────────────────────────────────────────────────────────────────
-- An INSTEAD OF DELETE trigger. This intercepts any attempt to delete a user.
-- If the user has an 'Admin' role, it blocks the deletion to prevent accidental 
-- lockout from the system. Otherwise, it allows the deletion to proceed.

CREATE OR ALTER TRIGGER trg_PreventAdminDeletion
ON Users
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- Check if any of the users being deleted are Admins
    IF EXISTS (SELECT 1 FROM deleted WHERE Role = 'Admin')
    BEGIN
        RAISERROR ('Security Violation: Cannot delete users with the Admin role.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END

    -- If no Admins are found, proceed with the actual deletion
    DELETE FROM Users
    WHERE UserID IN (SELECT UserID FROM deleted);
    
    PRINT 'Trigger [trg_PreventAdminDeletion]: Deletion check passed.';
END;
GO

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. SCALAR FUNCTION (Data Calculation)
-- ──────────────────────────────────────────────────────────────────────────────
-- Calculates the exact percentage (0-100) of the New Muslim Guide a user has completed.
-- This offloads mathematical processing from the Node.js API to the DB Engine.

CREATE OR ALTER FUNCTION fn_GetNewMuslimProgressPercent (@UserID INT)
RETURNS DECIMAL(5,2) -- Total 5 digits including 2 after decimal point
AS
BEGIN
    DECLARE @Completed INT;
    DECLARE @Total INT = 8; -- Total fundamentals in the guide
    DECLARE @Percentage DECIMAL(5,2);

    -- Get total completed sections for this specific user
    SELECT @Completed = COUNT(*) 
    FROM NewMuslim_Progress 
    WHERE UserID = @UserID AND IsCompleted = 1;

    -- Calculate percentage safely
    SET @Percentage = (CAST(@Completed AS DECIMAL(5,2)) / @Total) * 100.0;
    
    RETURN @Percentage;
END;
GO

-- ──────────────────────────────────────────────────────────────────────────────
-- SCALAR FUNCTION (Financial Calculation)
-- ──────────────────────────────────────────────────────────────────────────────
-- Calculates the exact Zakah owed based on a user's inputted total wealth and 
-- the current Nisab threshold. Returns 0 if wealth is below the threshold.

CREATE OR ALTER FUNCTION fn_CalculateZakah (
    @TotalWealth DECIMAL(18,2),
    @NisabThreshold DECIMAL(18,2)
)
RETURNS DECIMAL(18,2)
AS
BEGIN
    DECLARE @ZakahOwed DECIMAL(18,2) = 0.00;

    -- Zakah is only mandatory if wealth meets or exceeds the Nisab
    IF @TotalWealth >= @NisabThreshold
    BEGIN
        -- Zakah is 2.5% of total wealth
        SET @ZakahOwed = @TotalWealth * 0.025;
    END
    
    RETURN @ZakahOwed;
END;
GO

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. TRANSACTIONS 
-- ──────────────────────────────────────────────────────────────────────────────
-- Note: In modern Node.js apps, single-query updates are auto-committed. 
-- However, for complex multi-step operations, explicit BEGIN TRAN / COMMIT 
-- blocks are required to prevent partial data writes (maintaining ACID properties).

-- ------------------------------------------------------------------------------
-- TRANSACTION 1: Safe User Deletion & Audit 
-- ------------------------------------------------------------------------------
-- While ON DELETE CASCADE handles child records, wrapping deletion in a 
-- transaction ensures that if the server crashes mid-deletion, we don't end 
-- up with orphaned records or corrupted indexes. 
-- Atomicity and Consistency needed here!!
CREATE OR ALTER PROCEDURE sp_DeleteUserAccount_Tx
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
            -- 1. Verify User Exists
            IF NOT EXISTS (SELECT 1 FROM Users WHERE UserID = @UserID)
            BEGIN
                RAISERROR('User not found.', 16, 1);
            END

            -- 2. Execute Deletion (Cascades automatically handle child tables)
            DELETE FROM Users WHERE UserID = @UserID;
            
        COMMIT TRANSACTION;
        PRINT 'Transaction 1: User deleted safely.';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION; -- ensures some opened transaction still
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- ------------------------------------------------------------------------------
-- TRANSACTION 2: Toggle Habit Log Upsert
-- ------------------------------------------------------------------------------
-- Handles the complex logic of checking a habit. If it exists, update it.
-- If it doesn't exist, insert a new row for the day. The transaction ensures thread safety if 
-- the user double-clicks the button rapidly on the frontend, only one row per day added.
-- Atomicity and Consistency needed here!!
CREATE OR ALTER PROCEDURE sp_ToggleHabitLog_Tx
    @UserID INT,
    @HabitID INT,
    @LogDate DATE
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
            
            IF EXISTS (SELECT 1 FROM User_Habit_Logs WHERE UserID = @UserID AND HabitID = @HabitID AND LogDate = @LogDate)
            BEGIN
                -- Toggle existing record
                UPDATE User_Habit_Logs 
                SET IsCompleted = CASE WHEN IsCompleted = 1 THEN 0 ELSE 1 END
                WHERE UserID = @UserID AND HabitID = @HabitID AND LogDate = @LogDate;
            END
            ELSE
            BEGIN
                -- Insert new record
                INSERT INTO User_Habit_Logs (UserID, HabitID, LogDate, IsCompleted)
                VALUES (@UserID, @HabitID, @LogDate, 1);
            END

        COMMIT TRANSACTION;
        PRINT 'Transaction 2: Habit log toggled safely.';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @Msg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@Msg, 16, 1);
    END CATCH
END;
GO

-- ------------------------------------------------------------------------------
-- TRANSACTION 3: Reset New Muslim Progress
-- ------------------------------------------------------------------------------
-- A feature allowing a user to "Restart" their New Muslim guide.
-- It deletes all their progress rows safely in one atomic operation.
-- Consistency and Durability needed here!
CREATE OR ALTER PROCEDURE sp_ResetNewMuslimProgress_Tx
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
            
            -- Verify there is progress to delete
            IF EXISTS (SELECT 1 FROM NewMuslim_Progress WHERE UserID = @UserID)
            BEGIN
                DELETE FROM NewMuslim_Progress WHERE UserID = @UserID;
            END

        COMMIT TRANSACTION;
        PRINT 'Transaction 3: Progress reset successfully.';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrMsg, 16, 1);
    END CATCH
END;
GO

-- ------------------------------------------------------------------------------
-- TRANSACTION: Safe Bookmark Creation
-- ------------------------------------------------------------------------------
-- Ensures that a user does not accidentally create duplicate bookmarks for the 
-- same Ayat, Hadith, or Fiqh ruling, which would violate our UNIQUE constraints.
-- Atomicity and consistency needed here!
CREATE OR ALTER PROCEDURE sp_AddBookmark_Tx
    @UserID INT,
    @AyatID INT = NULL,
    @HadithID INT = NULL,
    @RulingID INT = NULL,
    @FolderName NVARCHAR(100) = 'General'
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
            
            -- Check if this specific bookmark already exists for this user
            IF EXISTS (
                SELECT 1 FROM User_Bookmarks 
                WHERE UserID = @UserID 
                  AND (AyatID = @AyatID OR (@AyatID IS NULL AND AyatID IS NULL))
                  AND (HadithID = @HadithID OR (@HadithID IS NULL AND HadithID IS NULL))
                  AND (RulingID = @RulingID OR (@RulingID IS NULL AND RulingID IS NULL))
            )
            BEGIN
                RAISERROR('Bookmark already exists.', 16, 1);
            END

            -- Safely insert the new bookmark
            INSERT INTO User_Bookmarks (UserID, AyatID, HadithID, RulingID, FolderName)
            VALUES (@UserID, @AyatID, @HadithID, @RulingID, @FolderName);

        COMMIT TRANSACTION;
        PRINT 'Transaction: Bookmark added safely.';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @Msg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@Msg, 16, 1);
    END CATCH
END;
GO

PRINT '==============================================================================';
PRINT 'EVALUATION FEATURES INSTALLED SUCCESSFULLY.';
PRINT '==============================================================================';