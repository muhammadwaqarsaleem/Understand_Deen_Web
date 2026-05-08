-- ============================================================
-- Understand Deen Web App — Master Database Schema
-- Version: Final (Safe / Idempotent Version)
-- ============================================================
-- PURPOSE:
--   This script safely initializes the database structure for 
--   any developer. It uses IF NOT EXISTS patterns, meaning it 
--   can be run multiple times safely without dropping tables 
--   or deleting existing data.
--
-- NOTE ON DATA IMPORT:
--   This script creates the STRUCTURE. To populate the massive 
--   rows of Quran, Ahadith, and Fiqh data, please restore from 
--   the provided .bak file or run the CSV import scripts.
-- ============================================================

-- ============================================================
-- PHASE 0: SAFE DATABASE CREATION
-- ============================================================
PRINT '──────────────────────────────────────────────────────';
PRINT 'PHASE 0: Initializing Database...';
PRINT '──────────────────────────────────────────────────────';

USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'UnderstandDeenDB')
BEGIN
    PRINT '  -> UnderstandDeenDB not found. Creating new database...';
    EXEC('CREATE DATABASE UnderstandDeenDB');
END
ELSE
BEGIN
    PRINT '  -> UnderstandDeenDB already exists. Proceeding...';
END
GO

USE UnderstandDeenDB;
GO

-- ============================================================
-- PHASE 1: CORE USER SYSTEM (Deliverable 2)
-- ============================================================
PRINT '──────────────────────────────────────────────────────';
PRINT 'PHASE 1: Creating User & Preference Tables...';
PRINT '──────────────────────────────────────────────────────';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        UserID          INT             CONSTRAINT PK_Users PRIMARY KEY IDENTITY(1,1),
        FullName        NVARCHAR(100)   NOT NULL,
        Email           VARCHAR(150)    NOT NULL CONSTRAINT UQ_Users_Email UNIQUE,
        PasswordHash    VARCHAR(255)    NOT NULL,
        Role            VARCHAR(20)     CONSTRAINT DF_Users_Role DEFAULT 'User',
        CreatedAt       DATETIME        CONSTRAINT DF_Users_CreatedAt DEFAULT GETDATE()
    );
    PRINT '  ✓ Users table created.';
END
ELSE PRINT '  - Users table already exists.';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'User_Preferences')
BEGIN
    CREATE TABLE User_Preferences (
        PrefID          INT             CONSTRAINT PK_UserPreferences PRIMARY KEY IDENTITY(1,1),
        UserID          INT             NOT NULL,
        ThemeMode       VARCHAR(20)     CONSTRAINT DF_Pref_Theme DEFAULT 'light',
        ArabicFont      VARCHAR(50)     CONSTRAINT DF_Pref_Font DEFAULT 'Uthmani',
        TranslationLang VARCHAR(10)     CONSTRAINT DF_Pref_Lang DEFAULT 'en',
        UpdatedAt       DATETIME        CONSTRAINT DF_Pref_Updated DEFAULT GETDATE(),

        CONSTRAINT UQ_User_Pref UNIQUE (UserID),
        CONSTRAINT FK_Preferences_User FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
    );
    PRINT '  ✓ User_Preferences table created.';
END
ELSE PRINT '  - User_Preferences table already exists.';
GO

-- ============================================================
-- PHASE 2: CONTENT DATA SCHEMA (v3 Optimized)
-- ============================================================
PRINT '──────────────────────────────────────────────────────';
PRINT 'PHASE 2: Creating Content Tables (Quran, Hadith, Fiqh)';
PRINT '──────────────────────────────────────────────────────';

-- 1. QURAN
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Quran_Ayats')
BEGIN
    CREATE TABLE Quran_Ayats (
        AyatID              INT             CONSTRAINT PK_Quran_Ayats PRIMARY KEY IDENTITY(1,1),
        SurahNo             TINYINT         NOT NULL,
        SurahNameEn         NVARCHAR(100)   NOT NULL,  
        SurahNameAr         NVARCHAR(100)   NOT NULL,
        SurahNameRoman      NVARCHAR(100)   NOT NULL,  
        TotalAyahSurah      SMALLINT        NOT NULL,
        TotalAyahQuran      SMALLINT        NOT NULL DEFAULT 6236,
        PlaceOfRevelation   NVARCHAR(20)    NOT NULL,  
        AyahNoSurah         SMALLINT        NOT NULL,
        AyahNoQuran         SMALLINT        NOT NULL,
        RukoNo              SMALLINT        NULL,
        JuzNo               TINYINT         NOT NULL,
        ManzilNo            TINYINT         NULL,
        HizbQuarter         TINYINT         NULL,
        AyahAr              NVARCHAR(MAX)   NOT NULL,
        AyahEn              NVARCHAR(MAX)   NOT NULL,
        IsSajdahAyah        NVARCHAR(10)    NULL,      
        SajdahNo            NVARCHAR(10)    NULL,      
        WordCount           SMALLINT        NULL,
        WordList            NVARCHAR(MAX)   NULL,

        CONSTRAINT UQ_Quran_AyahNoQuran  UNIQUE (AyahNoQuran),
        CONSTRAINT UQ_Quran_SurahAyah    UNIQUE (SurahNo, AyahNoSurah)
    );
    CREATE INDEX IX_Quran_SurahNo ON Quran_Ayats (SurahNo) INCLUDE (AyahNoSurah, AyahAr, AyahEn);
    CREATE INDEX IX_Quran_JuzNo   ON Quran_Ayats (JuzNo);
    PRINT '  ✓ Quran_Ayats table created.';
END
ELSE PRINT '  - Quran_Ayats table already exists.';

-- 2. AHADITH
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Ahadith')
BEGIN
    CREATE TABLE Ahadith (
        HadithID            INT             CONSTRAINT PK_Ahadith PRIMARY KEY IDENTITY(1,1),
        BookName            VARCHAR(100)    NOT NULL,
        ChapterNumber       SMALLINT        NULL,
        ChapterTitleAr      NVARCHAR(MAX)   NULL,  
        ChapterTitleEn      NVARCHAR(MAX)   NULL,
        ArabicText          NVARCHAR(MAX)   NULL,
        EnglishText         NVARCHAR(MAX)   NULL,  
        Grade               NVARCHAR(300)   NULL,  
        Reference           VARCHAR(300)    NULL,
        InBookReference     VARCHAR(300)    NULL,

        CONSTRAINT CHK_Hadith_BookName CHECK (
            BookName IN ('Sunan Ibn Majah', 'Sunan an-Nasa''i', 'Sahih al-Bukhari', 'Jami` at-Tirmidhi', 'Sunan Abi Dawud', 'Sahih Muslim')
        )
    );
    CREATE INDEX IX_Ahadith_BookName    ON Ahadith (BookName) INCLUDE (ChapterNumber, Reference, Grade);
    CREATE INDEX IX_Ahadith_BookChapter ON Ahadith (BookName, ChapterNumber);
    PRINT '  ✓ Ahadith table created.';
END
ELSE PRINT '  - Ahadith table already exists.';

-- 3. FIQH RULINGS
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Fiqh_Rulings')
BEGIN
    CREATE TABLE Fiqh_Rulings (
        RulingID            INT             CONSTRAINT PK_Fiqh_Rulings PRIMARY KEY IDENTITY(1,1),
        School              NVARCHAR(50)    NOT NULL,
        BookName            NVARCHAR(200)   NULL,
        Topic               NVARCHAR(200)   NOT NULL,
        NormalizedTopic     NVARCHAR(200)   NULL,
        Issue               NVARCHAR(MAX)   NULL,
        Ruling              NVARCHAR(MAX)   NOT NULL,
        QuranReference      NVARCHAR(4000)  NULL,   
        HadithReference     NVARCHAR(4000)  NULL,   

        CONSTRAINT CHK_Fiqh_School CHECK (School IN ('Hanafi', 'Maliki', 'Shafi', 'Hanbali', 'General'))
    );
    CREATE INDEX IX_Fiqh_School          ON Fiqh_Rulings(School);
    CREATE INDEX IX_Fiqh_NormalizedTopic ON Fiqh_Rulings(NormalizedTopic);
    CREATE INDEX IX_Fiqh_School_Topic    ON Fiqh_Rulings(School, Topic);
    PRINT '  ✓ Fiqh_Rulings table created.';
END
ELSE PRINT '  - Fiqh_Rulings table already exists.';
GO

-- ============================================================
-- PHASE 3: FEATURE TABLES (Bookmarks, Habits, New Muslim)
-- ============================================================
PRINT '──────────────────────────────────────────────────────';
PRINT 'PHASE 3: Creating Feature Tables...';
PRINT '──────────────────────────────────────────────────────';

-- 1. USER BOOKMARKS
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'User_Bookmarks')
BEGIN
    CREATE TABLE User_Bookmarks (
        BookmarkID  INT             CONSTRAINT PK_User_Bookmarks PRIMARY KEY IDENTITY(1,1),
        UserID      INT             NOT NULL,
        AyatID      INT             NULL,
        HadithID    INT             NULL,
        RulingID    INT             NULL,
        FolderName  NVARCHAR(100)   NULL,
        CreatedAt   DATETIME        CONSTRAINT DF_Bookmarks_CreatedAt DEFAULT GETDATE(),

        CONSTRAINT FK_Bookmarks_User FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
        CONSTRAINT FK_Bookmarks_Ayat FOREIGN KEY (AyatID) REFERENCES Quran_Ayats(AyatID),
        CONSTRAINT FK_Bookmarks_Hadith FOREIGN KEY (HadithID) REFERENCES Ahadith(HadithID),
        CONSTRAINT FK_Bookmarks_Ruling FOREIGN KEY (RulingID) REFERENCES Fiqh_Rulings(RulingID),

        CONSTRAINT CHK_Bookmark_Exclusive CHECK (
            (CASE WHEN AyatID IS NOT NULL THEN 1 ELSE 0 END +
             CASE WHEN HadithID IS NOT NULL THEN 1 ELSE 0 END +
             CASE WHEN RulingID IS NOT NULL THEN 1 ELSE 0 END) = 1
        ),
        CONSTRAINT UQ_Bookmark_UserAyat   UNIQUE (UserID, AyatID),
        CONSTRAINT UQ_Bookmark_UserHadith UNIQUE (UserID, HadithID),
        CONSTRAINT UQ_Bookmark_UserRuling UNIQUE (UserID, RulingID)
    );
    PRINT '  ✓ User_Bookmarks table created.';
END
ELSE PRINT '  - User_Bookmarks table already exists.';

-- 2. NEW MUSLIM PROGRESS
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'NewMuslim_Progress')
BEGIN
    CREATE TABLE NewMuslim_Progress (
        ProgressID    INT             CONSTRAINT PK_NewMuslim PRIMARY KEY IDENTITY(1,1),
        UserID        INT             NOT NULL,
        SectionName   VARCHAR(100)    NOT NULL,
        IsCompleted   BIT             CONSTRAINT DF_NewMuslim_Completed DEFAULT 0,
        LastToggled   DATETIME        CONSTRAINT DF_NewMuslim_Toggled DEFAULT GETDATE(),

        CONSTRAINT UQ_NewMuslim_UserSection UNIQUE (UserID, SectionName),
        CONSTRAINT FK_NewMuslim_User FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
    );
    PRINT '  ✓ NewMuslim_Progress table created.';
END
ELSE PRINT '  - NewMuslim_Progress table already exists.';

-- 3. HABIT TRACKER MASTER
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Habits_Master')
BEGIN
    CREATE TABLE Habits_Master (
        HabitID       INT             CONSTRAINT PK_HabitsMaster PRIMARY KEY IDENTITY(1,1),
        HabitName     VARCHAR(100)    NOT NULL,
        Category      VARCHAR(50)     NOT NULL,
        DisplayOrder  INT             NOT NULL DEFAULT 1
    );
    PRINT '  ✓ Habits_Master table created.';
END
ELSE PRINT '  - Habits_Master table already exists.';

-- 4. HABIT TRACKER LOGS
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'User_Habit_Logs')
BEGIN
    CREATE TABLE User_Habit_Logs (
        LogID         INT             CONSTRAINT PK_HabitLogs PRIMARY KEY IDENTITY(1,1),
        UserID        INT             NOT NULL,
        HabitID       INT             NOT NULL,
        LogDate       DATE            NOT NULL,
        IsCompleted   BIT             CONSTRAINT DF_HabitLog_Completed DEFAULT 1,

        CONSTRAINT UQ_HabitLog_Daily UNIQUE (UserID, HabitID, LogDate),
        CONSTRAINT FK_HabitLog_User FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
        CONSTRAINT FK_HabitLog_Habit FOREIGN KEY (HabitID) REFERENCES Habits_Master(HabitID) ON DELETE CASCADE
    );
    PRINT '  ✓ User_Habit_Logs table created.';
END
ELSE PRINT '  - User_Habit_Logs table already exists.';
GO

-- ============================================================
-- PHASE 4: SEED DATA & PROCEDURES
-- ============================================================
PRINT '──────────────────────────────────────────────────────';
PRINT 'PHASE 4: Seeding Data and Stored Procedures...';
PRINT '──────────────────────────────────────────────────────';

-- 1. Add the missing columns to your existing table
IF COL_LENGTH('Habits_Master', 'Category') IS NULL
BEGIN
    ALTER TABLE Habits_Master ADD Category VARCHAR(50) NOT NULL DEFAULT 'Uncategorized';
    PRINT 'Added missing Category column.';
END

IF COL_LENGTH('Habits_Master', 'DisplayOrder') IS NULL
BEGIN
    ALTER TABLE Habits_Master ADD DisplayOrder INT NOT NULL DEFAULT 1;
    PRINT 'Added missing DisplayOrder column.';
END
GO

-- 2. Now safely insert the seed data!
IF NOT EXISTS (SELECT 1 FROM Habits_Master WHERE HabitName = 'Fajr')
BEGIN
    INSERT INTO Habits_Master (HabitName, Category, DisplayOrder) VALUES 
    ('Fajr', 'Prayer', 1), ('Dhuhr', 'Prayer', 2), ('Asr', 'Prayer', 3),
    ('Maghrib', 'Prayer', 4), ('Isha', 'Prayer', 5), 
    ('Morning Azkar', 'Zikr', 6), ('Evening Azkar', 'Zikr', 7);
    PRINT '  ✓ Habit Master data seeded successfully!';
END
ELSE 
BEGIN
    PRINT '  - Habit Master data already exists.';
END
GO

-- Create or Alter Procedures (Native safe update)
CREATE OR ALTER PROCEDURE sp_RegisterUser
    @FullName     NVARCHAR(100),
    @Email        VARCHAR(150),
    @PasswordHash VARCHAR(255),
    @Role         VARCHAR(20) = 'User'
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM Users WHERE Email = @Email)
        BEGIN RAISERROR('EMAIL_ALREADY_EXISTS', 16, 1); RETURN; END

        IF @Email NOT LIKE '%_@__%.__%'
        BEGIN RAISERROR('INVALID_EMAIL_FORMAT', 16, 1); RETURN; END

        INSERT INTO Users (FullName, Email, PasswordHash, Role)
        VALUES (LTRIM(RTRIM(@FullName)), LOWER(@Email), @PasswordHash, @Role);

        SELECT SCOPE_IDENTITY() AS NewUserID;
    END TRY
    BEGIN CATCH
        DECLARE @Msg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@Msg, 16, 1);
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_LoginUser
    @Email VARCHAR(150)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT UserID, FullName, Email, PasswordHash, Role, CreatedAt
    FROM Users
    WHERE Email = LOWER(@Email);
END;
GO

PRINT '  ✓ Procedures compiled.';
PRINT '══════════════════════════════════════════════════════';
PRINT 'SCHEMA INITIALIZATION COMPLETE. NO DATA WAS DROPPED.';
PRINT '══════════════════════════════════════════════════════';
GO

-- ============================================================
-- VERIFICATION CHECKS 
-- ============================================================
SELECT COUNT(*) AS TotalUsers FROM Users;
SELECT COUNT(*) AS TotalQuran FROM Quran_Ayats; 
SELECT COUNT(*) AS TotalAhadith FROM Ahadith; 
SELECT COUNT(*) AS TotalFiqh FROM Fiqh_Rulings;