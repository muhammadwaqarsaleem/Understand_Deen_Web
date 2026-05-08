USE UnderstandDeenDB;
GO

-- 1. Disable constraints temporarily to allow a clean wipe
EXEC sp_MSforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL';

-- 2. Clear the tables
DELETE FROM Quran_Ayats;
DELETE FROM Fiqh_Rulings;
DELETE FROM Ahadith;

-- 3. Reset the ID counters to 1
DBCC CHECKIDENT ('Quran_Ayats', RESEED, 0);
DBCC CHECKIDENT ('Fiqh_Rulings', RESEED, 0);
DBCC CHECKIDENT ('Ahadith', RESEED, 0);

-- 4. Re-enable constraints
EXEC sp_MSforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL';
GO

PRINT 'Tables are now 100% empty and IDs are reset. You can start the Wizard.';