-- ============================================================
-- Understand Deen Web App — DB Project (BCS-6A)
-- SCRIPT: INITIAL SCHEMA PRODUCTION DEPLOYMENT
-- Version: 4.0 | Finalized & Optimized
-- ============================================================
-- PURPOSE:
--   1. Safely creates the UnderstandDeenDB if it doesn't exist.
--   2. Safely drops existing content tables (Reverse FK Order).
--   3. Builds optimized tables for Quran_Ayats, Ahadith, Fiqh.
--      (All columns natively support UTF-8 Arabic text).
--   4. Builds User_Bookmarks with strict relational integrity.
--   5. Initializes Authentication Stored Procedures.
--
-- NOTE TO DEVELOPERS: 
--   Run this script to initialize an empty database structure. 
--   To populate the 30,000+ rows of data, please restore from 
--   the provided .bak file, rather than running manual inserts.
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
    PRINT '  -> UnderstandDeenDB already exists. Proceeding with schema reset...';
END
GO

USE UnderstandDeenDB;
GO

-- ============================================================
-- PHASE 1: SAFE FK + TABLE TEARDOWN
-- ============================================================
PRINT '──────────────────────────────────────────────────────';
PRINT 'PHASE 1: Dropping dependent objects safely...';
PRINT '──────────────────────────────────────────────────────';

-- 1a. Drop User_Bookmarks FKs
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Bookmarks_Ayat')
    ALTER TABLE User_Bookmarks DROP CONSTRAINT FK_Bookmarks_Ayat;
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Bookmarks_Ruling')
    ALTER TABLE User_Bookmarks DROP CONSTRAINT FK_Bookmarks_Ruling;
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Bookmarks_Hadith')
    ALTER TABLE User_Bookmarks DROP CONSTRAINT FK_Bookmarks_Hadith;
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Bookmarks_User')
    ALTER TABLE User_Bookmarks DROP CONSTRAINT FK_Bookmarks_User;

-- 1b. Drop User_Bookmarks table
DROP TABLE IF EXISTS User_Bookmarks;

-- 1c. Drop old Fiqh mapping/lookup tables
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

-- 1d. Drop Content Tables
DROP TABLE IF EXISTS Ahadith;
DROP TABLE IF EXISTS Quran_Ayats;
DROP TABLE IF EXISTS Fiqh_Rulings;

PRINT '  ✓ Clean Teardown Complete.';
PRINT '';
GO

-- ============================================================
-- PHASE 2: QURAN_AYATS SCHEMA
-- ============================================================
PRINT '──────────────────────────────────────────────────────';
PRINT 'PHASE 2: Creating Quran_Ayats...';
PRINT '──────────────────────────────────────────────────────';

CREATE TABLE Quran_Ayats (
    AyatID              INT             CONSTRAINT PK_Quran_Ayats PRIMARY KEY IDENTITY(1,1),
    SurahNo             TINYINT         NOT NULL,
    SurahNameEn         NVARCHAR(100)   NOT NULL,  -- Upgraded to NVARCHAR for UTF-8 safety
    SurahNameAr         NVARCHAR(100)   NOT NULL,
    SurahNameRoman      NVARCHAR(100)   NOT NULL,  -- Upgraded to NVARCHAR
    TotalAyahSurah      SMALLINT        NOT NULL,
    TotalAyahQuran      SMALLINT        NOT NULL DEFAULT 6236,
    PlaceOfRevelation   NVARCHAR(20)    NOT NULL,  -- Upgraded to NVARCHAR(20)
    AyahNoSurah         SMALLINT        NOT NULL,
    AyahNoQuran         SMALLINT        NOT NULL,
    RukoNo              SMALLINT        NULL,
    JuzNo               TINYINT         NOT NULL,
    ManzilNo            TINYINT         NULL,
    HizbQuarter         TINYINT         NULL,
    AyahAr              NVARCHAR(MAX)   NOT NULL,
    AyahEn              NVARCHAR(MAX)   NOT NULL,
    
    -- Kept as text to directly accept 'TRUE'/'FALSE' and 'NA' text from CSV
    IsSajdahAyah        NVARCHAR(10)    NULL,      
    SajdahNo            NVARCHAR(10)    NULL,      
    
    WordCount           SMALLINT        NULL,
    WordList            NVARCHAR(MAX)   NULL,

    CONSTRAINT UQ_Quran_AyahNoQuran  UNIQUE (AyahNoQuran),
    CONSTRAINT UQ_Quran_SurahAyah    UNIQUE (SurahNo, AyahNoSurah)
);

CREATE INDEX IX_Quran_SurahNo ON Quran_Ayats (SurahNo) INCLUDE (AyahNoSurah, AyahAr, AyahEn);
CREATE INDEX IX_Quran_JuzNo   ON Quran_Ayats (JuzNo);

PRINT '  ✓ Quran_Ayats created.';
PRINT '';
GO

-- ============================================================
-- PHASE 3: AHADITH SCHEMA (Merged 6 Books)
-- ============================================================
PRINT '──────────────────────────────────────────────────────';
PRINT 'PHASE 3: Creating Ahadith...';
PRINT '──────────────────────────────────────────────────────';

CREATE TABLE Ahadith (
    HadithID            INT             CONSTRAINT PK_Ahadith PRIMARY KEY IDENTITY(1,1),
    BookName            VARCHAR(100)    NOT NULL,
    ChapterNumber       SMALLINT        NULL,
    ChapterTitleAr      NVARCHAR(MAX)   NULL,  -- MAX to accommodate Imam Bukhari's long titles
    ChapterTitleEn      NVARCHAR(MAX)   NULL,
    ArabicText          NVARCHAR(MAX)   NULL,
    EnglishText         NVARCHAR(MAX)   NULL,  -- NULL allowed for missing translations
    Grade               NVARCHAR(300)   NULL,  -- 300 to accommodate Imam Tirmidhi's detailed gradings
    Reference           VARCHAR(300)    NULL,
    InBookReference     VARCHAR(300)    NULL,

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

-- Indexing optimized for chapter lookups and UI filtering
CREATE INDEX IX_Ahadith_BookName    ON Ahadith (BookName) INCLUDE (ChapterNumber, Reference, Grade);
CREATE INDEX IX_Ahadith_BookChapter ON Ahadith (BookName, ChapterNumber);

PRINT '  ✓ Ahadith created.';
PRINT '';
GO

-- ============================================================
-- PHASE 4: FIQH_RULINGS SCHEMA
-- ============================================================
PRINT '──────────────────────────────────────────────────────';
PRINT 'PHASE 4: Creating Fiqh_Rulings...';
PRINT '──────────────────────────────────────────────────────';

CREATE TABLE Fiqh_Rulings (
    RulingID            INT             CONSTRAINT PK_Fiqh_Rulings PRIMARY KEY IDENTITY(1,1),
    School              NVARCHAR(50)    NOT NULL,
    BookName            NVARCHAR(200)   NULL,
    Topic               NVARCHAR(200)   NOT NULL,
    NormalizedTopic     NVARCHAR(200)   NULL,
    Issue               NVARCHAR(MAX)   NULL,
    Ruling              NVARCHAR(MAX)   NOT NULL,
    QuranReference      NVARCHAR(4000)  NULL,   -- Expanded for complex reference lists
    HadithReference     NVARCHAR(4000)  NULL,   -- Expanded for complex reference lists

    CONSTRAINT CHK_Fiqh_School CHECK (
        School IN ('Hanafi', 'Maliki', 'Shafi', 'Hanbali', 'General')
    )
);

CREATE INDEX IX_Fiqh_School          ON Fiqh_Rulings(School);
CREATE INDEX IX_Fiqh_NormalizedTopic ON Fiqh_Rulings(NormalizedTopic);
CREATE INDEX IX_Fiqh_School_Topic    ON Fiqh_Rulings(School, Topic);

PRINT '  ✓ Fiqh_Rulings created.';
PRINT '';
GO

-- ============================================================
-- PHASE 5: USER_BOOKMARKS SCHEMA
-- ============================================================
PRINT '──────────────────────────────────────────────────────';
PRINT 'PHASE 5: Rebuilding User_Bookmarks...';
PRINT '──────────────────────────────────────────────────────';

CREATE TABLE User_Bookmarks (
    BookmarkID  INT             CONSTRAINT PK_User_Bookmarks PRIMARY KEY IDENTITY(1,1),
    UserID      INT             NOT NULL,
    AyatID      INT             NULL,
    HadithID    INT             NULL,
    RulingID    INT             NULL,
    FolderName  NVARCHAR(100)   NULL,
    CreatedAt   DATETIME        CONSTRAINT DF_Bookmarks_CreatedAt DEFAULT GETDATE(),

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

    -- Ensures a bookmark points to ONE and ONLY ONE content type
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

PRINT '  ✓ Stored procedures refreshed.';
PRINT '';
GO

PRINT '══════════════════════════════════════════════════════';
PRINT 'SCHEMA INITIALIZATION COMPLETE.';
PRINT '══════════════════════════════════════════════════════';
GO

-- Verifying Quran import: first 10 Ayats to confirm the Arabic text and English translations imported cleanly
SELECT TOP 10 SurahNo, AyahNoSurah, AyahAr, AyahEn, PlaceOfRevelation 
FROM Quran_Ayats;
SELECT COUNT(*) AS TotalAyats FROM Quran_Ayats; -- Shall be 6236
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
GO


-- 3. Verify!
SELECT BookName, COUNT(*) AS TotalHadiths FROM Ahadith GROUP BY BookName;
GO

