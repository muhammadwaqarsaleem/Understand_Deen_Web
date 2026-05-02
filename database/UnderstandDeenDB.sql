-- ============================================================
-- Understand Deen Web App
-- DB Project (BCS-6A) | Deliverable 2: Auth Pipeline
-- Updated Master Script with RBAC, Stored Procedures
-- ============================================================

-- Step 1: Create & select the database
CREATE DATABASE UnderstandDeenDB;
GO

USE UnderstandDeenDB;
GO

-- =========================================
-- MODULE 1: QURANIC DATA
-- =========================================
-- TINYINT for SurahNumber: Perfect for 114 Surahs (max 255).
-- SMALLINT for AyatNumber: Handles max 286 Ayats per Surah comfortably.
CREATE TABLE Quran_Ayats (
    AyatID          INT         CONSTRAINT PK_Quran_Ayats PRIMARY KEY IDENTITY(1,1),
    SurahNumber     TINYINT     NOT NULL,
    AyatNumber      SMALLINT    NOT NULL,
    RukuNumber      SMALLINT,
    ParahNumber     TINYINT,
    ArabicText      NVARCHAR(MAX) NOT NULL,
    EnglishTranslation NVARCHAR(MAX) NOT NULL,

    -- Composite unique: no duplicate Surah+Ayat pair
    CONSTRAINT UQ_Quran_SurahAyat UNIQUE (SurahNumber, AyatNumber)
);
GO

-- =========================================
-- MODULE 2: COMPARATIVE FIQH
-- =========================================

-- The 4 canonical Sunni Madhabs
CREATE TABLE Sects (
    SectID   INT         CONSTRAINT PK_Sects PRIMARY KEY IDENTITY(1,1),
    SectName VARCHAR(50) NOT NULL CONSTRAINT UQ_SectName UNIQUE
);
GO

-- Hierarchical topic structure: MainTopic → SubTopic
CREATE TABLE Fiqh_Categories (
    CategoryID INT         CONSTRAINT PK_Fiqh_Categories PRIMARY KEY IDENTITY(1,1),
    MainTopic  VARCHAR(100) NOT NULL,  -- e.g., 'Prayer (Salah)'
    SubTopic   VARCHAR(255) NOT NULL   -- e.g., 'Placement of hands during Qiyam'
);
GO

-- Master Ahadith repository: Single source of truth, prevents duplication across sects
CREATE TABLE Ahadith (
    HadithID            INT           CONSTRAINT PK_Ahadith PRIMARY KEY IDENTITY(1,1),
    InternationalNumber VARCHAR(50),  -- e.g., 'Bukhari:1001' for academic citations
    BookName            VARCHAR(100)  NOT NULL,
    EnglishTranslation  NVARCHAR(MAX) NOT NULL
);
GO

-- Mapping table: Links a Sect + Fiqh Category to its source evidence (Hadith OR Ayat)
-- Cascade on Category/Sect: removing a topic/sect deletes its rulings (intended)
-- SET NULL on Hadith/Ayat: removing evidence keeps the ruling description intact
CREATE TABLE Sect_Rulings (
    RulingID            INT           CONSTRAINT PK_Sect_Rulings PRIMARY KEY IDENTITY(1,1),
    CategoryID          INT           NOT NULL,
    SectID              INT           NOT NULL,
    HadithID            INT,          -- Nullable: ruling may be based on Quranic evidence or consensus
    AyatID              INT,          -- Nullable: ruling may be based on Hadith
    RulingDescription   NVARCHAR(MAX) NOT NULL,

    CONSTRAINT FK_SectRulings_Category
        FOREIGN KEY (CategoryID) REFERENCES Fiqh_Categories(CategoryID)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT FK_SectRulings_Sect
        FOREIGN KEY (SectID) REFERENCES Sects(SectID)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT FK_SectRulings_Hadith
        FOREIGN KEY (HadithID) REFERENCES Ahadith(HadithID)
        ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT FK_SectRulings_Ayat
        FOREIGN KEY (AyatID) REFERENCES Quran_Ayats(AyatID)
        ON DELETE SET NULL ON UPDATE CASCADE
);
GO

-- =========================================
-- MODULE 3: USERS, ROLES & HABIT TRACKER
-- =========================================

-- *** DELIVERABLE 2 ADDITION: Role column for RBAC ***
-- Role: 'User' (default) | 'Admin'
-- NVARCHAR for FullName: Supports Arabic/Urdu names (Unicode)
-- VARCHAR for Email: ASCII-only; slightly faster indexing than NVARCHAR
CREATE TABLE Users (
    UserID       INT           CONSTRAINT PK_Users PRIMARY KEY IDENTITY(1,1),
    FullName     NVARCHAR(100) NOT NULL,
    Email        VARCHAR(150)  NOT NULL CONSTRAINT UQ_User_Email UNIQUE,
    PasswordHash VARCHAR(255)  NOT NULL,  -- bcrypt hash (Node.js layer handles hashing)
    Role         VARCHAR(20)   NOT NULL   CONSTRAINT DF_Users_Role DEFAULT 'User',
    CreatedAt    DATETIME                 CONSTRAINT DF_Users_CreatedAt DEFAULT GETDATE(),

    -- Basic email shape validation: x@xx.xx
    CONSTRAINT CHK_User_Email_Format CHECK (Email LIKE '%_@__%.__%'),

    -- Role domain constraint: only valid roles allowed
    CONSTRAINT CHK_User_Role CHECK (Role IN ('User', 'Admin'))
);
GO

-- Polymorphic Bookmarks (Exclusive Arc Pattern)
-- Exactly ONE of (AyatID, RulingID, HadithID) must be set at a time.
-- This is enforced by CHK_Bookmark_Exclusive below.
CREATE TABLE User_Bookmarks (
    BookmarkID INT      CONSTRAINT PK_User_Bookmarks PRIMARY KEY IDENTITY(1,1),
    UserID     INT      NOT NULL,
    AyatID     INT,
    RulingID   INT,
    HadithID   INT,
    FolderName NVARCHAR(100),  -- Future: Personalized bookmark folders
    CreatedAt  DATETIME CONSTRAINT DF_Bookmarks_CreatedAt DEFAULT GETDATE(),

    CONSTRAINT FK_Bookmarks_User
        FOREIGN KEY (UserID) REFERENCES Users(UserID)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT FK_Bookmarks_Ayat
        FOREIGN KEY (AyatID) REFERENCES Quran_Ayats(AyatID)
        ON DELETE NO ACTION ON UPDATE NO ACTION,

    CONSTRAINT FK_Bookmarks_Ruling
        FOREIGN KEY (RulingID) REFERENCES Sect_Rulings(RulingID)
        ON DELETE NO ACTION ON UPDATE NO ACTION,

    CONSTRAINT FK_Bookmarks_Hadith
        FOREIGN KEY (HadithID) REFERENCES Ahadith(HadithID)
        ON DELETE NO ACTION ON UPDATE NO ACTION,

    -- Exclusive arc: sum of non-null references must equal exactly 1
    CONSTRAINT CHK_Bookmark_Exclusive CHECK (
        (CASE WHEN AyatID   IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN RulingID IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN HadithID IS NOT NULL THEN 1 ELSE 0 END) = 1
    )
);
GO

-- Predefined trackable habits (Admin-managed catalog)
CREATE TABLE Habits_Master (
    HabitID          INT          CONSTRAINT PK_Habits_Master PRIMARY KEY IDENTITY(1,1),
    HabitName        VARCHAR(100) NOT NULL,
    HabitDescription VARCHAR(255)
);
GO

-- Daily habit completion log
-- UQ_UserHabitDate: prevents double-logging the same habit on the same day
CREATE TABLE User_Habit_Logs (
    LogID       INT  CONSTRAINT PK_User_Habit_Logs PRIMARY KEY IDENTITY(1,1),
    UserID      INT  NOT NULL,
    HabitID     INT  NOT NULL,
    LogDate     DATE NOT NULL,
    IsCompleted BIT  CONSTRAINT DF_HabitLogs_IsCompleted DEFAULT 0,

    CONSTRAINT FK_HabitLogs_User
        FOREIGN KEY (UserID) REFERENCES Users(UserID)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT FK_HabitLogs_Habit
        FOREIGN KEY (HabitID) REFERENCES Habits_Master(HabitID)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT UQ_UserHabitDate UNIQUE (UserID, HabitID, LogDate)
);
GO

-- =========================================
-- STORED PROCEDURES (Deliverable 2)
-- =========================================

-- ----------------------------------------------------
-- sp_RegisterUser
-- Purpose : Safely inserts a new user record.
-- Security: Duplicate email check uses TRY...CATCH.
--           Password hashing is NOT done here — bcrypt
--           is handled in the Node.js business logic
--           layer before calling this SP.
-- Returns : NewUserID on success; raises error on failure.
-- ----------------------------------------------------
CREATE OR ALTER PROCEDURE sp_RegisterUser
    @FullName     NVARCHAR(100),
    @Email        VARCHAR(150),
    @PasswordHash VARCHAR(255),
    @Role         VARCHAR(20) = 'User'   -- Defaults to 'User'; Admin can override
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY

        -- Guard 1: Duplicate email prevention (explicit check before insert)
        IF EXISTS (SELECT 1 FROM Users WHERE Email = @Email)
        BEGIN
            RAISERROR('EMAIL_ALREADY_EXISTS', 16, 1);
            RETURN;
        END;

        -- Guard 2: Email shape validation (mirrors CHK_User_Email_Format)
        IF @Email NOT LIKE '%_@__%.__%'
        BEGIN
            RAISERROR('INVALID_EMAIL_FORMAT', 16, 1);
            RETURN;
        END;

        -- Guard 3: Role whitelist
        IF @Role NOT IN ('User', 'Admin')
        BEGIN
            RAISERROR('INVALID_ROLE', 16, 1);
            RETURN;
        END;

        -- Guard 4: FullName must not be blank
        IF LEN(LTRIM(RTRIM(@FullName))) = 0
        BEGIN
            RAISERROR('FULLNAME_REQUIRED', 16, 1);
            RETURN;
        END;

        -- Insert the new user
        INSERT INTO Users (FullName, Email, PasswordHash, Role)
        VALUES (LTRIM(RTRIM(@FullName)), LOWER(@Email), @PasswordHash, @Role);

        -- Return the new UserID so the backend can embed it in the JWT payload
        SELECT SCOPE_IDENTITY() AS NewUserID;

    END TRY
    BEGIN CATCH
        -- Re-raise the error so Node.js catch block can inspect err.message
        DECLARE @Msg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@Msg, 16, 1);
    END CATCH
END;
GO

-- ----------------------------------------------------
-- sp_LoginUser
-- Purpose : Returns user record for a given email so
--           the Node.js backend can run bcrypt.compare().
-- Security: This SP deliberately does NOT verify the
--           password. Keeping crypto in the application
--           layer (Node.js/bcrypt) is a security best
--           practice — SQL Server should never receive
--           plaintext passwords.
-- Returns : Full user row if found; empty recordset if not.
--           Backend treats empty recordset as "user not found."
-- ----------------------------------------------------
CREATE OR ALTER PROCEDURE sp_LoginUser
    @Email VARCHAR(150)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        UserID,
        FullName,
        Email,
        PasswordHash,   -- Backend passes this to bcrypt.compare(plaintext, hash)
        Role,
        CreatedAt
    FROM Users
    WHERE Email = LOWER(@Email);
    -- Empty result → backend returns 401 "Invalid credentials"
END;
GO

-- =========================================
-- SEED DATA
-- =========================================

INSERT INTO Sects (SectName)
VALUES ('Hanafi'), ('Shafi''i'), ('Maliki'), ('Hanbali');

INSERT INTO Fiqh_Categories (MainTopic, SubTopic)
VALUES
    ('Prayer (Salah)', 'Placement of hands during standing (Qiyam)'),
    ('Prayer (Salah)', 'Saying "Ameen" aloud or silently after Al-Fatiha');

INSERT INTO Habits_Master (HabitName, HabitDescription)
VALUES
    ('Fajr Prayer',    'Offering the obligatory dawn prayer.'),
    ('Dhuhr Prayer',   'Offering the obligatory midday prayer.'),
    ('Asr Prayer',     'Offering the obligatory afternoon prayer.'),
    ('Maghrib Prayer', 'Offering the obligatory sunset prayer.'),
    ('Isha Prayer',    'Offering the obligatory night prayer.'),
    ('Morning Azkar',  'Reciting the daily morning remembrances.'),
    ('Evening Azkar',  'Reciting the daily evening remembrances.');
GO

PRINT 'UnderstandDeenDB schema and seed data created successfully.';
GO


-- =========================================
-- USEFUL ADMIN QUERIES (Highlight to execute)
-- =========================================

-- 1. View all registered accounts
SELECT UserID, FullName, Email, Role, CreatedAt, PasswordHash 
FROM Users;

-- 2. Promote a specific account to Admin
UPDATE Users 
SET Role = 'Admin' 
WHERE Email = 'waqar@gmail.com';


-- ===========================================
-- Updates after deliverable-2:

USE UnderstandDeenDB;
GO

-- ==============================================================
-- 1. User Preferences Table (For Web Theme & Font Toggles)
-- ==============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'User_Preferences')
BEGIN
    CREATE TABLE User_Preferences (
        PreferenceID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NOT NULL UNIQUE, -- One-to-One relationship with Users table
        Theme VARCHAR(20) DEFAULT 'Light', -- 'Light', 'Dark', 'Sepia'
        ArabicScript VARCHAR(20) DEFAULT 'Uthmanic', -- 'Uthmanic', 'Naskh'
        UpdatedAt DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_Preferences_User FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
    );
    PRINT 'User_Preferences table created successfully.';
END

-- ==============================================================
-- 2. New Muslim Progress Table (Toggleable Checklist)
-- ==============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'NewMuslim_Progress')
BEGIN
    CREATE TABLE NewMuslim_Progress (
        ProgressID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NOT NULL,
        SectionName VARCHAR(100) NOT NULL, -- e.g., 'Knowing Allah', 'Six Pillars'
        IsCompleted BIT DEFAULT 0,
        LastToggled DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_NewMuslim_User FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
        CONSTRAINT UQ_User_Section UNIQUE (UserID, SectionName) -- Prevents duplicate entries per user
    );
    PRINT 'NewMuslim_Progress table created successfully.';
END
GO