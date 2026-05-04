-- ============================================================
-- Understand Deen Web App — DB Project (BCS-6A)
-- MIGRATION SCRIPT: Content Tables Overhaul
-- Version: 3.2 | Team-Ready (Includes Safe DB Creation)
-- ============================================================
-- PURPOSE:
--   1. Safely creates the UnderstandDeenDB if it doesn't exist.
--   2. Safely drops existing content tables (Reverse FK Order).
--   3. Rebuilds Quran_Ayats, Ahadith, Fiqh_Rulings to match CSVs.
--   4. Rebuilds User_Bookmarks with correct relationships.
--
-- PRESERVED (NOT TOUCHED):
--   Users, User_Preferences, Habits_Master, User_Habit_Logs, 
--   NewMuslim_Progress, and Auth Stored Procedures.
--
-- EXECUTION:
--   Press F5 (or Execute) to run the entire script at once.
--   The 'GO' batch separators ensure correct execution order.
-- ============================================================

-- ============================================================
-- PHASE 0: SAFE DATABASE CREATION
-- ============================================================
PRINT '──────────────────────────────────────────────────────';
PRINT 'PHASE 0: Initializing Database...';
PRINT '──────────────────────────────────────────────────────';

-- Must be in the master database to create new databases
USE master;
GO

-- Check if the database exists. If not, create it dynamically.
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'UnderstandDeenDB')
BEGIN
    PRINT '  -> UnderstandDeenDB not found. Creating new database...';
    EXEC('CREATE DATABASE UnderstandDeenDB');
END
ELSE
BEGIN
    PRINT '  -> UnderstandDeenDB already exists. Proceeding with migration...';
END
GO

-- Now that we are guaranteed the DB exists, switch into it.
USE UnderstandDeenDB;
GO


-- ============================================================
-- PHASE 1: SAFE FK + TABLE TEARDOWN
-- ============================================================
-- We must drop in REVERSE dependency order:
--   User_Bookmarks (child of all 3 content tables)
--     → then Sect_Rulings (old mapping table)
--     → then Fiqh_Categories, Sects (old Fiqh tables)
--     → then Ahadith
--     → then Quran_Ayats
-- Using sys.foreign_keys for safe conditional FK removal
-- so the script never errors if run twice on a clean DB.
-- ============================================================

PRINT '──────────────────────────────────────────────────────';
PRINT 'PHASE 1: Dropping dependent objects safely...';
PRINT '──────────────────────────────────────────────────────';

-- ── 1a. Drop User_Bookmarks FKs ───────────────────────────────
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Bookmarks_Ayat')
    ALTER TABLE User_Bookmarks DROP CONSTRAINT FK_Bookmarks_Ayat;

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Bookmarks_Ruling')
    ALTER TABLE User_Bookmarks DROP CONSTRAINT FK_Bookmarks_Ruling;

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Bookmarks_Hadith')
    ALTER TABLE User_Bookmarks DROP CONSTRAINT FK_Bookmarks_Hadith;

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Bookmarks_User')
    ALTER TABLE User_Bookmarks DROP CONSTRAINT FK_Bookmarks_User;

PRINT '  ✓ User_Bookmarks foreign keys dropped (if existed).';

-- ── 1b. Drop User_Bookmarks table ────────────────────────────
DROP TABLE IF EXISTS User_Bookmarks;
PRINT '  ✓ User_Bookmarks dropped.';

-- ── 1c. Drop old Fiqh mapping/lookup tables ──────────────────
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_SectRulings_Category')
    ALTER TABLE Sect_Rulings DROP CONSTRAINT FK_SectRulings_Category;
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_SectRulings_Sect')
    ALTER TABLE Sect_Rulings DROP CONSTRAINT FK_SectRulings_Sect;
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_SectRulings_Hadith')
    ALTER TABLE Sect_Rulings DROP CONSTRAINT FK_SectRulings_Hadith;
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_SectRulings_Ayat')
    ALTER TABLE Sect_Rulings DROP CONSTRAINT FK_SectRulings_Ayat;

DROP TABLE IF EXISTS Sect_Rulings;
DROP TABLE IF EXISTS Fiqh_Categories;
DROP TABLE IF EXISTS Sects;
PRINT '  ✓ Old Fiqh tables dropped.';

-- ── 1d. Drop old Ahadith table ───────────────────────────────
DROP TABLE IF EXISTS Ahadith;
PRINT '  ✓ Old Ahadith table dropped.';

-- ── 1e. Drop old Quran_Ayats table ───────────────────────────
DROP TABLE IF EXISTS Quran_Ayats;
PRINT '  ✓ Old Quran_Ayats table dropped.';

-- ── 1f. Drop new Fiqh_Rulings if this script is re-run ───────
DROP TABLE IF EXISTS Fiqh_Rulings;
PRINT '  ✓ Fiqh_Rulings cleared (if existed).';

PRINT 'PHASE 1 complete.';
PRINT '';
GO


-- ============================================================
-- PHASE 2: QURAN_AYATS — Full 19-Column Schema
-- ============================================================
PRINT '──────────────────────────────────────────────────────';
PRINT 'PHASE 2: Creating Quran_Ayats...';
PRINT '──────────────────────────────────────────────────────';

CREATE TABLE Quran_Ayats (
    AyatID              INT           CONSTRAINT PK_Quran_Ayats PRIMARY KEY IDENTITY(1,1),
    SurahNo             TINYINT       NOT NULL,
    SurahNameEn         VARCHAR(100)  NOT NULL,
    SurahNameAr         NVARCHAR(100) NOT NULL,
    SurahNameRoman      VARCHAR(100)  NOT NULL,
    TotalAyahSurah      SMALLINT      NOT NULL,
    TotalAyahQuran      SMALLINT      NOT NULL DEFAULT 6236,
    PlaceOfRevelation   VARCHAR(10)   NOT NULL, -- Accepts 'Meccan'/'Medinan'
    AyahNoSurah         SMALLINT      NOT NULL,
    AyahNoQuran         SMALLINT      NOT NULL,
    RukoNo              SMALLINT      NULL,
    JuzNo               TINYINT       NOT NULL,
    ManzilNo            TINYINT       NULL,
    HizbQuarter         TINYINT       NULL,
    AyahAr              NVARCHAR(MAX) NOT NULL,
    AyahEn              NVARCHAR(MAX) NOT NULL,
    
    -- Kept as VARCHAR so the SSMS Wizard accepts 'TRUE'/'FALSE' and 'NA' text directly.
    IsSajdahAyah        VARCHAR(10)   NULL,     
    SajdahNo            VARCHAR(10)   NULL,     
    
    WordCount           SMALLINT      NULL,
    WordList            NVARCHAR(MAX) NULL,

    CONSTRAINT UQ_Quran_AyahNoQuran  UNIQUE (AyahNoQuran),
    CONSTRAINT UQ_Quran_SurahAyah    UNIQUE (SurahNo, AyahNoSurah)
);

CREATE INDEX IX_Quran_SurahNo
    ON Quran_Ayats (SurahNo)
    INCLUDE (AyahNoSurah, AyahAr, AyahEn);

CREATE INDEX IX_Quran_JuzNo ON Quran_Ayats (JuzNo);

PRINT '  ✓ Quran_Ayats created with all 19 CSV columns.';
PRINT '';
GO


-- ============================================================
-- PHASE 3: AHADITH — Full 9-Column Schema
-- ============================================================
PRINT '──────────────────────────────────────────────────────';
PRINT 'PHASE 3: Creating Ahadith...';
PRINT '──────────────────────────────────────────────────────';

CREATE TABLE Ahadith (
    HadithID            INT           CONSTRAINT PK_Ahadith PRIMARY KEY IDENTITY(1,1),
    BookName            VARCHAR(100)  NOT NULL,
    ChapterNumber       SMALLINT      NULL,
    ChapterTitleAr      NVARCHAR(500) NULL,
    ChapterTitleEn      NVARCHAR(500) NULL,
    ArabicText          NVARCHAR(MAX) NULL,
    EnglishText         NVARCHAR(MAX) NOT NULL,
    Grade               VARCHAR(50)   NULL,
    Reference           VARCHAR(300)  NULL,
    InBookReference     VARCHAR(300)  NULL,

    -- EXACT MATCH to user CSV data (escaped quotes carefully)
    CONSTRAINT CHK_Hadith_BookName CHECK (
        BookName IN (
            'Sunan Ibn Majah', 
            'Sunan an-Nasa''i',  
            'Sahih al-Bukhari', 
            'Jami` at-Tirmidhi', 
            'Sunan Abi Dawud', 
            'Sahih Muslim'
        )
    )
);

CREATE INDEX IX_Ahadith_BookName
    ON Ahadith (BookName)
    INCLUDE (ChapterNumber, Reference, Grade);

CREATE INDEX IX_Ahadith_BookChapter
    ON Ahadith (BookName, ChapterNumber);

PRINT '  ✓ Ahadith created with all 9 CSV columns.';
PRINT '';
GO


-- ============================================================
-- PHASE 4: FIQH_RULINGS — Flat Import Table
-- ============================================================
PRINT '──────────────────────────────────────────────────────';
PRINT 'PHASE 4: Creating Fiqh_Rulings (flat, CSV-ready)...';
PRINT '──────────────────────────────────────────────────────';

CREATE TABLE Fiqh_Rulings (
    RulingID            INT           CONSTRAINT PK_Fiqh_Rulings PRIMARY KEY IDENTITY(1,1),
    School              VARCHAR(50)   NOT NULL,
    BookName            VARCHAR(200)  NULL,
    Topic               NVARCHAR(500) NULL,
    NormalizedTopic     VARCHAR(500)  NULL,
    Issue               NVARCHAR(MAX) NULL,
    Ruling              NVARCHAR(MAX) NOT NULL,
    QuranReference      VARCHAR(500)  NULL,
    HadithReference     VARCHAR(500)  NULL,

    -- EXACT MATCH to user CSV data
    CONSTRAINT CHK_Fiqh_School CHECK (
        School IN ('Hanafi', 'Shafi', 'Maliki', 'Hanbali')
    )
);

CREATE INDEX IX_Fiqh_NormalizedTopic
    ON Fiqh_Rulings (NormalizedTopic)
    INCLUDE (School, Topic, Issue);

CREATE INDEX IX_Fiqh_School
    ON Fiqh_Rulings (School)
    INCLUDE (NormalizedTopic, Topic);

CREATE INDEX IX_Fiqh_School_Topic
    ON Fiqh_Rulings (School, NormalizedTopic);

PRINT '  ✓ Fiqh_Rulings created. Direct CSV import supported.';
PRINT '';
GO


-- ============================================================
-- PHASE 5: USER_BOOKMARKS — Rebuilt with Correct FKs
-- ============================================================
PRINT '──────────────────────────────────────────────────────';
PRINT 'PHASE 5: Rebuilding User_Bookmarks...';
PRINT '──────────────────────────────────────────────────────';

CREATE TABLE User_Bookmarks (
    BookmarkID  INT           CONSTRAINT PK_User_Bookmarks PRIMARY KEY IDENTITY(1,1),
    UserID      INT           NOT NULL,
    AyatID      INT           NULL,
    HadithID    INT           NULL,
    RulingID    INT           NULL,
    FolderName  NVARCHAR(100) NULL,
    CreatedAt   DATETIME      CONSTRAINT DF_Bookmarks_CreatedAt DEFAULT GETDATE(),

    CONSTRAINT FK_Bookmarks_User
        FOREIGN KEY (UserID) REFERENCES Users(UserID)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT FK_Bookmarks_Ayat
        FOREIGN KEY (AyatID) REFERENCES Quran_Ayats(AyatID)
        ON DELETE NO ACTION ON UPDATE NO ACTION,

    CONSTRAINT FK_Bookmarks_Hadith
        FOREIGN KEY (HadithID) REFERENCES Ahadith(HadithID)
        ON DELETE NO ACTION ON UPDATE NO ACTION,

    CONSTRAINT FK_Bookmarks_Ruling
        FOREIGN KEY (RulingID) REFERENCES Fiqh_Rulings(RulingID)
        ON DELETE NO ACTION ON UPDATE NO ACTION,

    CONSTRAINT CHK_Bookmark_Exclusive CHECK (
        (CASE WHEN AyatID   IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN HadithID IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN RulingID IS NOT NULL THEN 1 ELSE 0 END) = 1
    ),

    CONSTRAINT UQ_Bookmark_UserAyat   UNIQUE (UserID, AyatID),
    CONSTRAINT UQ_Bookmark_UserHadith UNIQUE (UserID, HadithID),
    CONSTRAINT UQ_Bookmark_UserRuling UNIQUE (UserID, RulingID)
);

CREATE INDEX IX_Bookmarks_UserID ON User_Bookmarks (UserID);

PRINT '  ✓ User_Bookmarks rebuilt with correct FK references.';
PRINT '';
GO


-- ============================================================
-- PHASE 6: UPDATE STORED PROCEDURES
-- ============================================================
PRINT '──────────────────────────────────────────────────────';
PRINT 'PHASE 6: Refreshing stored procedures...';
PRINT '──────────────────────────────────────────────────────';
GO
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

        IF @Role NOT IN ('User', 'Admin')
        BEGIN RAISERROR('INVALID_ROLE', 16, 1); RETURN; END

        IF LEN(LTRIM(RTRIM(@FullName))) = 0
        BEGIN RAISERROR('FULLNAME_REQUIRED', 16, 1); RETURN; END

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

PRINT '  ✓ Stored procedures refreshed (unchanged, idempotent).';
PRINT '';
GO

PRINT '══════════════════════════════════════════════════════';
PRINT 'MIGRATION COMPLETE. Database is ready for CSV import.';
PRINT '══════════════════════════════════════════════════════';
GO

-- Upgrade the conflicting columns to Unicode (NVARCHAR) so they accept UTF-8 seamlessly
ALTER TABLE Quran_Ayats ALTER COLUMN SurahNameEn NVARCHAR(100) NOT NULL;
ALTER TABLE Quran_Ayats ALTER COLUMN SurahNameRoman NVARCHAR(100) NOT NULL;
ALTER TABLE Quran_Ayats ALTER COLUMN PlaceOfRevelation NVARCHAR(20) NOT NULL;
ALTER TABLE Quran_Ayats ALTER COLUMN IsSajdahAyah NVARCHAR(10) NULL;
ALTER TABLE Quran_Ayats ALTER COLUMN SajdahNo NVARCHAR(10) NULL;

PRINT 'Columns upgraded to NVARCHAR successfully.';
GO

-- Verifying Quran import: first 10 Ayats to confirm the Arabic text and English translations imported cleanly
SELECT TOP 10 SurahNo, AyahNoSurah, AyahAr, AyahEn, PlaceOfRevelation 
FROM Quran_Ayats;
SELECT COUNT(*) AS TotalAyats FROM Quran_Ayats;
GO

-- 1. Drop dependencies that block column changes
ALTER TABLE Fiqh_Rulings DROP CONSTRAINT IF EXISTS CHK_Fiqh_School;
DROP INDEX IF EXISTS IX_Fiqh_School ON Fiqh_Rulings;
DROP INDEX IF EXISTS IX_Fiqh_NormalizedTopic ON Fiqh_Rulings;
DROP INDEX IF EXISTS IX_Fiqh_School_Topic ON Fiqh_Rulings;
GO
-- 2. Apply your optimized lengths (NVARCHAR for Unicode/Arabic support)
ALTER TABLE Fiqh_Rulings ALTER COLUMN BookName NVARCHAR(200) NULL;
ALTER TABLE Fiqh_Rulings ALTER COLUMN Topic NVARCHAR(200) NOT NULL;
ALTER TABLE Fiqh_Rulings ALTER COLUMN NormalizedTopic NVARCHAR(200) NULL;
ALTER TABLE Fiqh_Rulings ALTER COLUMN QuranReference NVARCHAR(4000) NULL;
ALTER TABLE Fiqh_Rulings ALTER COLUMN HadithReference NVARCHAR(4000) NULL;
GO
-- 3. Restore the constraints and indexes
ALTER TABLE Fiqh_Rulings ADD CONSTRAINT CHK_Fiqh_School CHECK (School IN ('Hanafi', 'Maliki', 'Shafi', 'Hanbali', 'General'));
CREATE INDEX IX_Fiqh_School ON Fiqh_Rulings(School);
CREATE INDEX IX_Fiqh_NormalizedTopic ON Fiqh_Rulings(NormalizedTopic);
CREATE INDEX IX_Fiqh_School_Topic ON Fiqh_Rulings(School, Topic);
GO
PRINT 'Schema updated: Topics at 200, References at 4000. Indexes restored.';
GO

-- 1. Confirm the exact row count (Should be exactly 1522)
SELECT COUNT(*) AS TotalFiqhRulings 
FROM Fiqh_Rulings;

-- 2. Let's look at the actual data, especially checking those long references!
SELECT TOP 10 
    School, 
    Topic, 
    LEFT(Issue, 75) + '...' AS Issue_Preview, 
    QuranReference,
    HadithReference
FROM Fiqh_Rulings;